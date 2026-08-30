"""
Owner: Anuj
SQLAlchemy ORM models with Multi-Tenant Factory isolation and User Auth.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Factory(Base):
    __tablename__ = "factories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)  # e.g. TATA-7X3K
    location = Column(String, nullable=True)
    industry = Column(String, default="general")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lines = relationship("FactoryLine", back_populates="factory", cascade="all, delete-orphan")
    users = relationship("User", back_populates="factory")


class FactoryLine(Base):
    __tablename__ = "factory_lines"
    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), index=True, nullable=False)
    name = Column(String, nullable=False)  # e.g. "Line-1"
    machine_count = Column(Integer, default=3)
    target_per_shift = Column(Integer, default=1000)
    shifts = Column(String, default="A,B,C")

    factory = relationship("Factory", back_populates="lines")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="operator")  # owner | manager | qc_inspector | maintenance_engineer | operator
    factory_id = Column(Integer, ForeignKey("factories.id"), index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    factory = relationship("Factory", back_populates="users")


class ProductionEvent(Base):
    __tablename__ = "production_events"
    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), index=True, nullable=True)
    line_id = Column(String, index=True)
    count = Column(Integer, default=0)
    target = Column(Integer, default=0)
    shift = Column(String, default="A")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DowntimeEvent(Base):
    __tablename__ = "downtime_events"
    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), index=True, nullable=True)
    line_id = Column(String, index=True)
    machine_id = Column(String, index=True)
    duration_seconds = Column(Integer, default=0)
    reason = Column(String, default="unknown")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DefectRecord(Base):
    __tablename__ = "defect_records"
    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), index=True, nullable=True)
    defect_type = Column(String, index=True)
    confidence = Column(Float)
    image_ref = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), index=True, nullable=True)
    source_module = Column(String, index=True)  # vision | maintenance | safety
    type = Column(String, index=True)
    status = Column(String, default="open")
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
