import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.booking import Booking
from app.models.lead import Lead
from app.models.property import Property
from app.schemas.booking import BookingCreate, BookingDetailResponse, BookingResponse, BookingUpdate
from app.services.email import format_pkr, send_booking_confirmation
from app.services.scoring import calculate_lead_score

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_STATUSES = {"pending", "confirmed", "completed", "cancelled"}


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(booking_in: BookingCreate, db: Session = Depends(get_db)):
    prop = (
        db.query(Property)
        .filter(Property.id == booking_in.property_id, Property.is_active == True)  # noqa: E712
        .first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    lead_id = booking_in.lead_id
    conversation_id = booking_in.conversation_id

    # Link/create a lead automatically when contact details exist
    if not lead_id and (booking_in.email or booking_in.phone):
        lead = None
        if conversation_id:
            lead = (
                db.query(Lead)
                .filter(Lead.source == "chat", Lead.conversation_id == conversation_id)
                .first()
            )
        if not lead and booking_in.email:
            lead = db.query(Lead).filter(Lead.email == booking_in.email).first()
        if not lead:
            lead = Lead(source="website" if not conversation_id else "chat", status="new")
            db.add(lead)
        if conversation_id:
            lead.conversation_id = conversation_id
        if booking_in.name:
            lead.name = booking_in.name
        if booking_in.email:
            lead.email = booking_in.email
        if booking_in.phone:
            lead.phone = booking_in.phone
        lead.city = prop.city
        lead.property_type = prop.property_type
        notes_marker = f"booking for '{prop.title}'"
        existing_notes = lead.notes or ""
        if notes_marker not in existing_notes:
            lead.notes = f"{notes_marker}; {existing_notes}".strip("; ")
        lead.status = "viewing_scheduled"
        lead.score = calculate_lead_score(lead)
        db.flush()
        lead_id = lead.id

    booking = Booking(
        property_id=prop.id,
        lead_id=lead_id,
        conversation_id=conversation_id,
        name=booking_in.name,
        email=booking_in.email,
        phone=booking_in.phone,
        scheduled_at=booking_in.scheduled_at,
        notes=booking_in.notes,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    if booking.email:
        sent = send_booking_confirmation(
            to_email=booking.email,
            name=booking.name,
            property_title=prop.title,
            property_location=f"{prop.area}, {prop.city}",
            scheduled_at=booking.scheduled_at.strftime("%A, %d %B %Y at %I:%M %p"),
        )
        if sent:
            logger.info("Booking confirmation email sent to %s", booking.email)

    return booking


@router.get("/", response_model=list[BookingDetailResponse])
def get_bookings(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Booking).filter(Booking.status != "cancelled")
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    bookings = (
        query.order_by(Booking.scheduled_at.asc()).offset(skip).limit(limit).all()
    )

    results = []
    for b in bookings:
        prop = db.get(Property, b.property_id)
        item = BookingDetailResponse.model_validate(b, from_attributes=True)
        item.property_title = prop.title if prop else None
        item.property_city = prop.city if prop else None
        item.property_area = prop.area if prop else None
        results.append(item)
    return results


@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    prop = db.get(Property, booking.property_id)
    item = BookingDetailResponse.model_validate(booking, from_attributes=True)
    item.property_title = prop.title if prop else None
    item.property_city = prop.city if prop else None
    item.property_area = prop.area if prop else None
    return item


@router.patch("/{booking_id}", response_model=BookingResponse)
def update_booking(booking_id: int, booking_in: BookingUpdate, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    data = booking_in.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status; use one of {sorted(VALID_STATUSES)}")

    for field, value in data.items():
        setattr(booking, field, value)
    db.commit()
    db.refresh(booking)
    return booking


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "cancelled"
    db.commit()
    return None
