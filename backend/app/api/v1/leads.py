from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.services.scoring import calculate_lead_score

router = APIRouter()


@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    db_lead = Lead(**lead_in.model_dump())
    db_lead.score = calculate_lead_score(db_lead)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


@router.get("/", response_model=list[LeadResponse])
def get_leads(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    search: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(Lead).filter(Lead.is_active == True)  # noqa: E712

    if status_filter:
        query = query.filter(Lead.status == status_filter)
    if search:
        like = f"%{search}%"
        query = query.filter(
            Lead.name.ilike(like) | Lead.email.ilike(like) | Lead.phone.ilike(like)
        )

    return (
        query.order_by(Lead.score.desc(), Lead.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, lead_in: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, value in lead_in.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    lead.score = calculate_lead_score(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.is_active = False
    db.commit()
    return None
