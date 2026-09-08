from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.booking import Booking
from app.models.conversation import Conversation
from app.models.lead import Lead
from app.models.property import Property

router = APIRouter()


@router.get("/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    active_properties = (
        db.query(func.count(Property.id))
        .filter(Property.is_active == True)  # noqa: E712
        .scalar()
    ) or 0

    available_properties = (
        db.query(func.count(Property.id))
        .filter(Property.is_active == True, Property.status == "available")  # noqa: E712
        .scalar()
    ) or 0

    total_leads = db.query(func.count(Lead.id)).filter(Lead.is_active == True).scalar() or 0  # noqa: E712
    hot_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.is_active == True, Lead.score >= 60)  # noqa: E712
        .scalar()
    ) or 0

    avg_score = (
        db.query(func.avg(Lead.score)).filter(Lead.is_active == True).scalar()  # noqa: E712
    )
    avg_score = round(avg_score or 0)

    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).filter(Booking.status != "cancelled").scalar() or 0
    pending_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.status.in_(["pending", "confirmed"]))
        .scalar()
    ) or 0

    inventory_value = (
        db.query(func.sum(Property.price))
        .filter(
            Property.is_active == True,  # noqa: E712
            Property.price_type == "total",
            Property.status != "sold",
        )
        .scalar()
    ) or 0

    leads_by_status_rows = (
        db.query(Lead.status, func.count(Lead.id))
        .filter(Lead.is_active == True)  # noqa: E712
        .group_by(Lead.status)
        .all()
    )
    leads_by_status = {status_: count for status_, count in leads_by_status_rows}

    properties_by_city_rows = (
        db.query(Property.city, func.count(Property.id))
        .filter(Property.is_active == True)  # noqa: E712
        .group_by(Property.city)
        .all()
    )
    properties_by_city = {city: count for city, count in properties_by_city_rows}

    recent_leads = (
        db.query(Lead)
        .filter(Lead.is_active == True)  # noqa: E712
        .order_by(Lead.created_at.desc())
        .limit(5)
        .all()
    )

    upcoming_bookings = (
        db.query(Booking)
        .filter(Booking.status.in_(["pending", "confirmed"]))
        .order_by(Booking.scheduled_at.asc())
        .limit(5)
        .all()
    )

    def lead_dto(lead):
        return {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "city": lead.city,
            "property_type": lead.property_type,
            "budget": lead.budget,
            "score": lead.score,
            "status": lead.status,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
        }

    def booking_dto(booking):
        prop = db.get(Property, booking.property_id)
        return {
            "id": booking.id,
            "name": booking.name,
            "scheduled_at": booking.scheduled_at.isoformat() if booking.scheduled_at else None,
            "status": booking.status,
            "property_title": prop.title if prop else None,
            "property_location": f"{prop.area}, {prop.city}" if prop else None,
        }

    return {
        "totalProperties": active_properties,
        "availableProperties": available_properties,
        "totalLeads": total_leads,
        "hotLeads": hot_leads,
        "avgScore": avg_score,
        "conversations": total_conversations,
        "bookings": total_bookings,
        "pendingBookings": pending_bookings,
        "inventoryValuePkr": float(inventory_value),
        "leadsByStatus": leads_by_status,
        "propertiesByCity": properties_by_city,
        "recentLeads": [lead_dto(l) for l in recent_leads],
        "upcomingBookings": [booking_dto(b) for b in upcoming_bookings],
    }
