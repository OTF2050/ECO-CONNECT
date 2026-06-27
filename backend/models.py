from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from backend.database import Base, engine

# ==========================================================================
# RELATIONAL DATABASE SCHEMA DEFINITIONS (SQLAlchemy)
# ==========================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="farmer") # 'farmer', 'admin', 'tourist'
    eco_credits = Column(Integer, default=100) # starting credits for demo/users
    status = Column(String, default="active", nullable=True) # 'active', 'suspended', 'verified'
    
    # Relationships
    farmer_profile = relationship("Farmer", uselist=False, back_populates="user", cascade="all, delete-orphan")
    reports = relationship("EcoReport", back_populates="reporter", cascade="all, delete-orphan")
    inventory = relationship("MarketInventory", back_populates="owner", cascade="all, delete-orphan")
    purchases = relationship("Transaction", back_populates="buyer", cascade="all, delete-orphan")
    gov_requests = relationship("GovernmentRequest", back_populates="farmer", cascade="all, delete-orphan")

class Farmer(Base):
    __tablename__ = "farmers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    crop_type = Column(String, nullable=True)
    farm_size = Column(Float, nullable=True) # in hectares
    region = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="farmer_profile")

class EcoReport(Base):
    __tablename__ = "eco_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False) # 'water', 'soil', 'crop', 'waste'
    severity = Column(String, nullable=False) # 'Low', 'Medium', 'Critical'
    status = Column(String, default="Pending") # 'Pending', 'Dispatched', 'Resolved'
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    assigned_dept = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    reporter = relationship("User", back_populates="reports")

class MarketInventory(Base):
    __tablename__ = "market_inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String, nullable=False) # 'sell', 'donate'
    price = Column(Float, default=0.0)
    stock = Column(Integer, default=1)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="inventory")
    transactions = relationship("Transaction", back_populates="item", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("market_inventory.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    item = relationship("MarketInventory", back_populates="transactions")
    buyer = relationship("User", back_populates="purchases")

class ReportAuditLog(Base):
    __tablename__ = "report_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=False)
    old_status = Column(String, nullable=False)
    new_status = Column(String, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)

class GovernmentRequest(Base):
    __tablename__ = "government_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_type = Column(String, nullable=False) # 'subsidy', 'water_quota', 'permit', 'equipment'
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    amount_requested = Column(Float, nullable=True)
    status = Column(String, default="Pending") # 'Pending', 'Approved', 'Rejected'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    farmer = relationship("User", back_populates="gov_requests")

class Ecotour(Base):
    __tablename__ = "ecotours"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    region = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    owner = relationship("User")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    tour_id = Column(Integer, ForeignKey("ecotours.id", ondelete="CASCADE"), nullable=False)
    visitor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    slots = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    booking_date = Column(String, nullable=False) # e.g. '2026-06-28'
    status = Column(String, default="Confirmed") # 'Confirmed', 'Cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tour = relationship("Ecotour")
    visitor = relationship("User")

# ==========================================================================
# CRM — community entrepreneur customer relationship management
# ==========================================================================

class Contact(Base):
    __tablename__ = "crm_contacts"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    contact_type = Column(String, default="lead")  # 'lead', 'customer', 'supplier', 'partner'
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    status = Column(String, default="new")  # 'new', 'contacted', 'negotiating', 'won', 'lost'
    value = Column(Float, default=0.0)  # estimated deal value (AED)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions = relationship("Interaction", back_populates="contact", cascade="all, delete-orphan")

class Interaction(Base):
    __tablename__ = "crm_interactions"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("crm_contacts.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String, default="note")  # 'call', 'email', 'meeting', 'note'
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    contact = relationship("Contact", back_populates="interactions")

# ==========================================================================
# SMART MARKETPLACE: LOGISTICS (FARM-TO-HUB CARPOOLING) & TRACEABILITY
# ==========================================================================

class DeliveryTrip(Base):
    __tablename__ = "delivery_trips"

    id = Column(Integer, primary_key=True, index=True)
    organizer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    hub_name = Column(String, nullable=False)          # destination hub / market
    depart_region = Column(String, nullable=False)     # origin region
    depart_date = Column(String, nullable=False)        # ISO date string (demo simplicity)
    depart_time = Column(String, nullable=True)
    capacity_kg = Column(Float, default=500.0)          # total truck capacity
    distance_km = Column(Float, default=60.0)           # one-way distance for savings calc
    notes = Column(Text, nullable=True)
    status = Column(String, default="open")            # 'open', 'full', 'departed', 'completed'
    created_at = Column(DateTime, default=datetime.utcnow)

    organizer = relationship("User")
    participants = relationship("TripParticipant", back_populates="trip", cascade="all, delete-orphan")

class TripParticipant(Base):
    __tablename__ = "trip_participants"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("delivery_trips.id", ondelete="CASCADE"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farmer_name = Column(String, nullable=True)
    produce = Column(String, nullable=False)            # what they are shipping
    weight_kg = Column(Float, default=0.0)
    status = Column(String, default="confirmed")       # 'confirmed', 'cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("DeliveryTrip", back_populates="participants")
    farmer = relationship("User")

class TraceabilityRecord(Base):
    __tablename__ = "traceability_records"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String, unique=True, index=True, nullable=False)  # slug used in QR / public URL
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String, nullable=False)
    batch_label = Column(String, nullable=True)         # e.g. "Batch #A-2026-06"
    harvest_date = Column(String, nullable=True)        # ISO date string
    farm_location = Column(String, nullable=True)
    water_technique = Column(String, nullable=True)     # water-saving technique used
    certifications = Column(String, nullable=True)      # comma list e.g. "Organic, Pesticide-free"
    notes = Column(Text, nullable=True)
    prev_hash = Column(String, nullable=True)           # previous record hash (per-owner chain)
    batch_hash = Column(String, nullable=False)         # sha256(prev_hash + payload)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")

# ==========================================================================
# SMART AI ONBOARDING — DOCUMENT VAULT (KYC / "MY FILES")
# ==========================================================================

class UserDocument(Base):
    __tablename__ = "user_documents"

    doc_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String, nullable=False)               # 'Emirates ID', 'Agricultural Holding Certificate'
    extracted_id_number = Column(String, nullable=True)     # AI-extracted licence / ID number
    expiry_date = Column(String, nullable=True)             # ISO date string
    holder_name = Column(String, nullable=True)             # AI-extracted holder name
    verification_status = Column(String, default="AI_Verified")  # 'AI_Verified', 'Pending', 'Rejected'
    file_url = Column(String, nullable=True)                # served path to the uploaded file
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")

# ==========================================================================
# DATABASE INITIALIZATION AND TRIGGERS SETUP
# ==========================================================================

def init_db():
    # Create all defined tables in SQLite
    Base.metadata.create_all(bind=engine)
    
    # Check if eco_credits column exists in users table and add if missing (migration)
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            columns = [r[1] for r in res]
            if "eco_credits" not in columns:
                print("[Database Migration] Adding 'eco_credits' column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN eco_credits INTEGER DEFAULT 100"))
                conn.commit()
            if "status" not in columns:
                print("[Database Migration] Adding 'status' column to users table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'active'"))
                conn.commit()
        except Exception as migration_error:
            print(f"[Database Migration] Column check failed or column already exists: {migration_error}")

    # Establish SQLite trigger for status log logging
    trigger_sql = """
    CREATE TRIGGER IF NOT EXISTS log_status_change
    AFTER UPDATE OF status ON eco_reports
    FOR EACH ROW
    BEGIN
        INSERT INTO report_audit_logs (report_id, old_status, new_status, changed_at)
        VALUES (OLD.id, OLD.status, NEW.status, CURRENT_TIMESTAMP);
    END;
    """
    
    with engine.connect() as conn:
        conn.execute(text(trigger_sql))
        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database structures and triggers initialized successfully.")
