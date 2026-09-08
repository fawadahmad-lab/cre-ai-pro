"""Seed the database with realistic Pakistani commercial real-estate demo data.

Usage: venv/bin/python seed_data.py
Drops and recreates all tables, then inserts properties + a few sample leads.
"""
import sys

from app.db.base import Base
from app.db.session import engine, SessionLocal

from app.models import Property, Lead  # noqa: F401  (register models)
from app.services.scoring import calculate_lead_score

DEMO_PROPERTIES = [
    {
        "title": "Corporate Office Floor - Gulberg III",
        "property_type": "office",
        "city": "Lahore",
        "area": "Gulberg III",
        "size": 8000,
        "size_unit": "Sqft",
        "price": 350_000_000,
        "price_type": "total",
        "listing_type": "sale",
        "status": "available",
        "description": "Brand-new fitted office floor in a Grade-A tower. Dedicated parking, backup power, high-speed elevators and panoramic city views.",
        "features": "Central AC, Backup Power, Dedicated Parking, Elevator, Security, Fire Safety",
    },
    {
        "title": "Retail Shop - Emporium Mall Strip",
        "property_type": "shop",
        "city": "Lahore",
        "area": "Johar Town",
        "size": 1200,
        "size_unit": "Sqft",
        "price": 450_000,
        "price_type": "per_sqft",
        "listing_type": "sale",
        "status": "available",
        "description": "Prime retail unit on the main boulevard facing Emporium Mall. Heavy footfall, ideal for flagship brand stores or F&B.",
        "features": "Main Boulevard Facing, High Footfall, Glass Frontage, Food Court Nearby",
    },
    {
        "title": "Commercial Plot - DHA Phase 6 (Cca)",
        "property_type": "plot",
        "city": "Lahore",
        "area": "DHA Phase 6",
        "size": 8,
        "size_unit": "Marla",
        "price": 95_000_000,
        "price_type": "total",
        "listing_type": "sale",
        "status": "available",
        "description": "Cca category commercial plot on a 150-ft wide road. Perfect for plaza construction or long-term investment.",
        "features": "Corner Plot, Main Road, Gated Community, Utilities Available",
    },
    {
        "title": "Warehouse - Sundar Industrial Estate",
        "property_type": "office",
        "city": "Lahore",
        "area": "Sundar Industrial Estate",
        "size": 24000,
        "size_unit": "Sqft",
        "price": 1_800_000,
        "price_type": "total",
        "listing_type": "rent",
        "status": "available",
        "description": "Modern logistics warehouse with 32-ft clear height, loading docks and truck turning radius. Ideal for distribution & e-commerce.",
        "features": "Loading Docks, 32ft Height, Truck Access, Fire Safety, 24/7 Security",
    },
    {
        "title": "Office Space - Blue Area Twin City Tower",
        "property_type": "office",
        "city": "Islamabad",
        "area": "Blue Area",
        "size": 4200,
        "size_unit": "Sqft",
        "price": 280_000_000,
        "price_type": "total",
        "listing_type": "sale",
        "status": "available",
        "description": "Half-floor corporate office in Islamabad's most prestigious business district. Fully fitted, ready to move.",
        "features": "Fitted, Central AC, Backup Power, Parking, Metro Access, Security",
    },
    {
        "title": "Shop - F-7 Markaz (Jinnah Super)",
        "property_type": "shop",
        "city": "Islamabad",
        "area": "F-7 Markaz",
        "size": 900,
        "size_unit": "Sqft",
        "price": 650_000,
        "price_type": "total",
        "listing_type": "rent",
        "status": "available",
        "description": "Ground-floor shop in Jinnah Super Market. Established retail hub with premium clientele.",
        "features": "Ground Floor, Prime Market, High Visibility, Ample Parking",
    },
    {
        "title": "Agricultural + Commercial Land - Chak Shahzad",
        "property_type": "plot",
        "city": "Islamabad",
        "area": "Chak Shahzad",
        "size": 2,
        "size_unit": "Kanal",
        "price": 120_000_000,
        "price_type": "total",
        "listing_type": "sale",
        "status": "available",
        "description": "Dual-use land parcel with farmhouse potential near Kurri Road interchange. Clear title, immediate transfer.",
        "features": "Clear Title, Road Frontage, Utilities, Investment Potential",
    },
    {
        "title": "Corporate Office - I.I. Chundrigar Business Centre",
        "property_type": "office",
        "city": "Karachi",
        "area": "I.I. Chundrigar",
        "size": 6500,
        "size_unit": "Sqft",
        "price": 420_000_000,
        "price_type": "total",
        "listing_type": "sale",
        "status": "available",
        "description": "Full floor in Karachi's financial district, neighbouring major banks. Sea-facing corner units with dedicated lobby.",
        "features": "Sea View, Financial District, Dedicated Lobby, Backup Power, Parking",
    },
    {
        "title": "Retail Outlet - Zamzama Boulevard",
        "property_type": "shop",
        "city": "Karachi",
        "area": "DHA Phase 5",
        "size": 1800,
        "size_unit": "Sqft",
        "price": 950_000,
        "price_type": "total",
        "listing_type": "rent",
        "status": "available",
        "description": "Flagship retail space on Karachi's premier shopping boulevard. Previously occupied by an international clothing brand.",
        "features": "Main Boulevard, Brand Neighbours, Glass Facade, Generator Backup",
    },
    {
        "title": "Commercial Plot - Clifton Block 4",
        "property_type": "plot",
        "city": "Karachi",
        "area": "Clifton Block 4",
        "size": 600,
        "size_unit": "Sq. Yard",
        "price": 210_000_000,
        "price_type": "total",
        "listing_type": "sale",
        "status": "reserved",
        "description": "Rare vacant plot in Clifton's restaurant row. Approved for commercial plaza up to G+6 floors.",
        "features": "G+6 Approved, Restaurant Row, High Traffic, Clear Title",
    },
    {
        "title": "Apartment Tower Retail - Emaar Crescent Bay",
        "property_type": "shop",
        "city": "Karachi",
        "area": "DHA Phase 8",
        "size": 1100,
        "size_unit": "Sqft",
        "price": 85_000_000,
        "price_type": "total",
        "listing_type": "sale",
        "status": "available",
        "description": "Ground-floor retail unit inside a gated waterfront community of 2,000+ families. Guaranteed catchment.",
        "features": "Gated Community, Waterfront, Built-in Catchment, Modern Infrastructure",
    },
    {
        "title": "Showroom - M.M. Alam Road",
        "property_type": "shop",
        "city": "Lahore",
        "area": "Gulberg V",
        "size": 2600,
        "size_unit": "Sqft",
        "price": 2_200_000,
        "price_type": "total",
        "listing_type": "rent",
        "status": "available",
        "description": "Double-height showroom space on Lahore's auto mile. Perfect for automotive, electronics or furniture brands.",
        "features": "Double Height, Display Windows, Valet Parking, Signage Rights",
    },
]

DEMO_LEADS = [
    {
        "name": "Ahmed Raza Khan",
        "email": "ahmed.raza@techvision.pk",
        "phone": "0300-1234567",
        "city": "Lahore",
        "property_type": "office",
        "budget": 300_000_000,
        "status": "qualified",
        "source": "chat",
        "notes": "Looking for HQ for software house; wants Gulberg or DHA; viewing requested",
        "score": 88,
    },
    {
        "name": "Fatima Siddiqui",
        "email": "fatima.s@retailbrands.com",
        "phone": "0321-9876543",
        "city": "Karachi",
        "property_type": "shop",
        "budget": 90_000_000,
        "status": "contacted",
        "source": "chat",
        "notes": "Expanding fashion brand into Karachi; contact details shared",
        "score": 76,
    },
    {
        "name": "Bilal Ahmed",
        "email": None,
        "phone": "0333-5551234",
        "city": "Islamabad",
        "property_type": "plot",
        "budget": 100_000_000,
        "status": "new",
        "source": "chat",
        "notes": "Investor exploring commercial plots",
        "score": 58,
    },
]


def seed() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Tables recreated.")

    db = SessionLocal()
    try:
        for item in DEMO_PROPERTIES:
            db.add(Property(**item))
        for item in DEMO_LEADS:
            lead = Lead(**item)
            lead.score = calculate_lead_score(lead)
            db.add(lead)
        db.commit()
        print(f"Seeded {len(DEMO_PROPERTIES)} properties and {len(DEMO_LEADS)} leads.")
    finally:
        db.close()


if __name__ == "__main__":
    confirm = "--yes" in sys.argv or input("Drop all data and reseed? [y/N] ").lower().startswith("y")
    if confirm:
        seed()
    else:
        print("Aborted.")
