from app.db.base import Base
from app.db.session import engine
from app.models.property import Property
from app.models.lead import Lead

Base.metadata.drop_all(bind=engine, tables=[Property.__table__, Lead.__table__])
Base.metadata.create_all(bind=engine, tables=[Property.__table__, Lead.__table__])