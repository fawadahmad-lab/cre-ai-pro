from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.property import Property
from app.schemas.property import PropertyCreate, PropertyResponse, PropertyUpdate

router = APIRouter()


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(property_in: PropertyCreate, db: Session = Depends(get_db)):
    db_property = Property(**property_in.model_dump())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property


@router.get("/", response_model=list[PropertyResponse])
def get_properties(
    skip: int = 0,
    limit: int = 100,
    city: str = None,
    property_type: str = None,
    status: str = None,
    listing_type: str = None,
    search: str = None,
    min_price: float = None,
    max_price: float = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Property)
    if not include_inactive:
        query = query.filter(Property.is_active == True)  # noqa: E712

    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if status:
        query = query.filter(Property.status == status)
    if listing_type:
        query = query.filter(Property.listing_type == listing_type)
    if search:
        like = f"%{search}%"
        query = query.filter(
            Property.title.ilike(like)
            | Property.area.ilike(like)
            | Property.city.ilike(like)
        )
    if min_price is not None:
        query = query.filter(Property.price >= min_price)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)

    return (
        query.order_by(Property.created_at.desc()).offset(skip).limit(limit).all()
    )


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    property_obj = (
        db.query(Property)
        .filter(Property.id == property_id, Property.is_active == True)  # noqa: E712
        .first()
    )
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_obj


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, property_in: PropertyUpdate, db: Session = Depends(get_db)):
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    for field, value in property_in.model_dump(exclude_unset=True).items():
        setattr(property_obj, field, value)

    db.commit()
    db.refresh(property_obj)
    return property_obj


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: int, db: Session = Depends(get_db)):
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    property_obj.is_active = False  # soft delete
    db.commit()
    return None
