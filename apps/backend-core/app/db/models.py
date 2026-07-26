"""
Owner: Anuj
SQLAlchemy ORM models. This is the shared contract's real implementation —
if you change a column here, update docs/api-contracts.md in the same PR.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.db.database import Base


class ProductionEvent(Base):
    __tablename__ = "production_events"
    id = Column(Integer, primary_key=True, index=True)
    line_id = Column(String, index=True)
    count = Column(Integer, default=0)
    target = Column(Integer, default=0)
    shift = Column(String, default="A")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DowntimeEvent(Base):
    __tablename__ = "downtime_events"
    id = Column(Integer, primary_key=True, index=True)
    line_id = Column(String, index=True)
    machine_id = Column(String, index=True)
    duration_seconds = Column(Integer, default=0)
    reason = Column(String, default="unknown")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DefectRecord(Base):
    __tablename__ = "defect_records"
    id = Column(Integer, primary_key=True, index=True)
    defect_type = Column(String, index=True)
    confidence = Column(Float)
    image_ref = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    source_module = Column(String, index=True)   # vision | maintenance | safety
    type = Column(String, index=True)
    status = Column(String, default="open")
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
