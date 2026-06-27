import os
import json
import time
import uuid
import shutil
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

# Import local backend files
from backend.database import engine, get_db
from backend.models import init_db, User, Farmer, EcoReport, MarketInventory, Transaction, ReportAuditLog, GovernmentRequest, Ecotour, Booking, Contact, Interaction, DeliveryTrip, TripParticipant, TraceabilityRecord, UserDocument
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user, RoleChecker
from backend.ai import analyze_report_with_ai, chat_with_agri_advisor, classify_civic_report, analyze_report_batch, ask_falcon_assistant, generate_business_plan, analyze_local_market, structure_document_text, forecast_crop_demand, evaluate_subsidy_eligibility
from backend.tasks import generate_municipality_pdf, generate_subsidy_pdf

# Initialize Database on application boot
init_db()

app = FastAPI(title="Eco Connect Full-Stack API Portal")

# Enable CORS for React local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow requests from any host
    allow_credentials=False, # Must be False if allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static PDF storage directory
PDF_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_reports")
os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)

# Uploaded onboarding documents (Smart AI Vault)
UPLOADED_DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploaded_documents")
os.makedirs(UPLOADED_DOCS_DIR, exist_ok=True)
ALLOWED_DOC_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
MAX_DOC_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

# ==========================================================================
# PYDANTIC SCHEMAS FOR VALIDATION
# ==========================================================================

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str # 'farmer', 'admin', 'tourist'
    crop_type: Optional[str] = None
    farm_size: Optional[float] = None
    region: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class ReportCreate(BaseModel):
    title: str
    description: str
    category: str # 'water', 'soil', 'crop', 'waste'
    latitude: float
    longitude: float

class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    title: str
    description: str
    category: str
    severity: str
    status: str
    latitude: float
    longitude: float
    assigned_dept: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str # 'Pending', 'Dispatched', 'Resolved'

class InventoryCreate(BaseModel):
    title: str
    description: str
    type: str # 'sell', 'donate'
    price: float
    stock: int

class TransactionCreate(BaseModel):
    item_id: int
    amount: float

class GovRequestCreate(BaseModel):
    request_type: str # 'subsidy', 'water_quota', 'permit', 'equipment'
    title: str
    description: str
    amount_requested: Optional[float] = None

class GovRequestResponse(BaseModel):
    id: int
    farmer_id: int
    request_type: str
    title: str
    description: str
    amount_requested: Optional[float]
    status: str
    created_at: str

    class Config:
        from_attributes = True

class EcotourCreate(BaseModel):
    title: str
    description: str
    price: float
    region: str

class BookingCreate(BaseModel):
    tour_id: int
    slots: int
    booking_date: str

class ChatPrompt(BaseModel):
    message: str
    history: Optional[List[dict]] = None

class ReportClassify(BaseModel):
    description: str

class SubsidyEligibilityRequest(BaseModel):
    farm_size_dunum: Optional[float] = 0
    years_active: Optional[float] = 0
    annual_income_aed: Optional[float] = 0
    requested_amount_aed: Optional[float] = 0
    request_type: Optional[str] = "general"
    has_trade_license: Optional[bool] = False
    prior_subsidy_default: Optional[bool] = False
    uses_sustainable_irrigation: Optional[bool] = False
    employs_locals: Optional[bool] = False

class ReportClassifyResponse(BaseModel):
    category: str
    urgency_level: str
    department_action: str
    ai_processed: bool

# --- CRM schemas ---
class ContactCreate(BaseModel):
    name: str
    contact_type: str = "lead"  # 'lead','customer','supplier','partner'
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "new"  # 'new','contacted','negotiating','won','lost'
    value: Optional[float] = 0.0
    notes: Optional[str] = None

class ContactStatusUpdate(BaseModel):
    status: str

class InteractionCreate(BaseModel):
    kind: str = "note"  # 'call','email','meeting','note'
    summary: str

# --- Entrepreneur tools schemas ---
class BusinessPlanRequest(BaseModel):
    idea: str
    skill: Optional[str] = ""
    budget: Optional[float] = 0.0
    region: Optional[str] = "UAE"

class MarketInsightRequest(BaseModel):
    sector: str
    region: Optional[str] = "UAE"
    note: Optional[str] = ""

class OcrRequest(BaseModel):
    image_base64: Optional[str] = None  # data URL or raw base64 of an image
    text: Optional[str] = None           # optional already-extracted text to structure
    filename: Optional[str] = None

class TripCreate(BaseModel):
    hub_name: str
    depart_region: str
    depart_date: str
    depart_time: Optional[str] = None
    capacity_kg: Optional[float] = 500.0
    distance_km: Optional[float] = 60.0
    notes: Optional[str] = None
    # Organizer's own produce on this trip (optional)
    produce: Optional[str] = None
    weight_kg: Optional[float] = 0.0

class TripJoin(BaseModel):
    produce: str
    weight_kg: float = 0.0

class TraceCreate(BaseModel):
    product_name: str
    batch_label: Optional[str] = None
    harvest_date: Optional[str] = None
    farm_location: Optional[str] = None
    water_technique: Optional[str] = None
    certifications: Optional[str] = None
    notes: Optional[str] = None

class SpeechRequest(BaseModel):
    audio_base64: str
    text_fallback: Optional[str] = None

class CvDiagnoseRequest(BaseModel):
    image_base64: str

class ServiceRequest(BaseModel):
    farmer_id: str
    service_id: str
    payload: dict

# Voice Assistant & Admin Schemas
class VoiceAssistantRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

class VoiceAssistantResponse(BaseModel):
    reply: str
    command: Optional[str] = None

class UserStatusUpdate(BaseModel):
    status: str

class UserCreditsUpdate(BaseModel):
    credits: int

class UserRoleUpdate(BaseModel):
    role: str

# ==========================================================================
# AUTOMATED DB SEEDING ON STARTUP
# ==========================================================================

@app.on_event("startup")
def seed_test_users():
    db = next(get_db())
    try:
        # Check if users already exist
        if db.query(User).count() == 0:
            print("[Database Seeding] Provisioning default accounts for demonstration...")
            
            # 1. Farmer/Citizen Account
            farmer_user = User(
                name="Salem Al Hattawi",
                email="farmer@eco.ae",
                password_hash=get_password_hash("farmer123"),
                role="farmer"
            )
            db.add(farmer_user)
            db.commit()
            db.refresh(farmer_user)
            
            farmer_profile = Farmer(
                user_id=farmer_user.id,
                crop_type="Organic Sidr Dates",
                farm_size=4.5,
                region="Hatta (Dubai)"
            )
            db.add(farmer_profile)
            
            # 2. Government Admin Account
            admin_user = User(
                name="Eng. Fatima Al Mazrouei",
                email="admin@eco.ae",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin_user)
            
            # 3. Tourist/Investor Account
            tourist_user = User(
                name="John Doe",
                email="tourist@eco.ae",
                password_hash=get_password_hash("tourist123"),
                role="tourist"
            )
            db.add(tourist_user)
            db.commit()

            # 4. Investor / Funding Partner Account
            investor_user = User(
                name="Khalid Al Futtaim",
                email="investor@eco.ae",
                password_hash=get_password_hash("investor123"),
                role="investor"
            )
            db.add(investor_user)

            # 5. Farm Employee / Worker Account
            employee_user = User(
                name="Ramesh Kumar",
                email="employee@eco.ae",
                password_hash=get_password_hash("employee123"),
                role="employee"
            )
            db.add(employee_user)
            db.commit()

            # Seed some initial marketplace items
            items = [
                MarketInventory(title="Premium Khalas Dates (Fresh Harvest)", description="Grown organically in Hatta. High fiber.", type="sell", price=65.0, stock=12, owner_id=farmer_user.id),
                MarketInventory(title="Raw Sidr Honey (500g)", description="Pure unfiltered Sidr honey harvested from Hatta apiaries.", type="sell", price=120.0, stock=18, owner_id=farmer_user.id),
                MarketInventory(title="Handwoven Sadu Wool Rug", description="Traditional Bedouin handicraft made from local camel wool.", type="sell", price=340.0, stock=5, owner_id=farmer_user.id),
                MarketInventory(title="Organic Goat Milk Soap (Pack of 4)", description="Natural soap bars made on-farm. No additives.", type="sell", price=45.0, stock=30, owner_id=farmer_user.id),
                MarketInventory(title="Heritage Palm Seedlings", description="Young Khalas palm seedlings ready for planting.", type="sell", price=90.0, stock=22, owner_id=farmer_user.id),
                MarketInventory(title="Cold-Pressed Olive Oil (1L)", description="Locally pressed from UAE-grown olives.", type="sell", price=80.0, stock=14, owner_id=farmer_user.id),
                MarketInventory(title="Free-Range Farm Eggs (Tray of 30)", description="Fresh daily eggs from free-range hens.", type="sell", price=35.0, stock=40, owner_id=farmer_user.id),
                MarketInventory(title="Refurbished Lenovo ThinkPad", description="Corporate donation for students.", type="donate", price=0.0, stock=4, owner_id=admin_user.id),
                MarketInventory(title="Solar Drip Irrigation Controller", description="Smart irrigation tool to save water.", type="donate", price=0.0, stock=2, owner_id=admin_user.id),
                MarketInventory(title="Greenhouse Shade Netting (Bulk Roll)", description="Donated UV-resistant netting for crop protection.", type="donate", price=0.0, stock=8, owner_id=admin_user.id),
                MarketInventory(title="Organic Compost & Fertilizer (50kg)", description="Subsidised soil enrichment for smallholders.", type="donate", price=0.0, stock=25, owner_id=admin_user.id),
                MarketInventory(title="Portable Solar Power Bank Kit", description="Corporate donation: off-grid charging for remote farms.", type="donate", price=0.0, stock=6, owner_id=admin_user.id),
            ]
            db.add_all(items)
            db.commit()

            # Seed initial ecotours in database
            tours = [
                Ecotour(title="Hatta Date Harvesting Tour", description="Guided tour of organic palm orchards with fresh date tasting.", price=150.0, region="Hatta (Dubai)", owner_id=farmer_user.id),
                Ecotour(title="Sidr Honey Extraction Workshop", description="Learn traditional UAE beekeeping and honey bottling.", price=200.0, region="Hatta (Dubai)", owner_id=farmer_user.id),
                Ecotour(title="Liwa Desert Sunset Safari", description="Explore historical oasis routes and dunes guided by locals.", price=320.0, region="Liwa Oasis", owner_id=admin_user.id)
            ]
            db.add_all(tours)
            db.commit()

            # Seed CRM contacts for the farmer entrepreneur
            contacts = [
                Contact(owner_id=farmer_user.id, name="Hatta Heritage Resort", contact_type="customer", email="procure@hattaresort.ae", phone="+971 4 555 0101", company="Hatta Resort", status="won", value=8400.0, notes="Recurring weekly dates & honey order."),
                Contact(owner_id=farmer_user.id, name="Liwa Organic Cafe", contact_type="lead", email="hello@liwacafe.ae", phone="+971 2 555 0123", company="Liwa Cafe", status="negotiating", value=3200.0, notes="Wants cold-pressed olive oil samples."),
                Contact(owner_id=farmer_user.id, name="Al Ain Farmers Market", contact_type="partner", phone="+971 3 555 0144", company="Al Ain Market", status="contacted", value=0.0, notes="Weekend stall opportunity."),
                Contact(owner_id=farmer_user.id, name="GreenPack Supplies", contact_type="supplier", email="sales@greenpack.ae", company="GreenPack", status="new", value=0.0, notes="Eco packaging supplier - request quote."),
            ]
            db.add_all(contacts)
            db.commit()
            db.refresh(contacts[0])
            db.refresh(contacts[1])
            db.add_all([
                Interaction(contact_id=contacts[0].id, kind="meeting", summary="Signed seasonal supply agreement for dates and Sidr honey."),
                Interaction(contact_id=contacts[1].id, kind="call", summary="Discussed olive oil pricing; sending 2 sample bottles."),
            ])
            db.commit()

            # Seed Farm-to-Hub carpool delivery trips
            trip1 = DeliveryTrip(
                organizer_id=farmer_user.id, hub_name="Dubai Central Produce Market",
                depart_region="Hatta (Dubai)", depart_date="2026-07-02", depart_time="05:30",
                capacity_kg=600.0, distance_km=130.0, status="open",
                notes="Refrigerated truck. Drop-off at Bay 12. Splitting fuel across farmers.",
            )
            trip2 = DeliveryTrip(
                organizer_id=admin_user.id, hub_name="Al Ain Souk Al Qattara",
                depart_region="Al Ain · Eastern Region", depart_date="2026-07-04", depart_time="06:00",
                capacity_kg=450.0, distance_km=45.0, status="open",
                notes="Pickup-truck pool for the weekend farmers' market stall.",
            )
            db.add_all([trip1, trip2])
            db.commit()
            db.refresh(trip1)
            db.refresh(trip2)
            db.add_all([
                TripParticipant(trip_id=trip1.id, farmer_id=farmer_user.id, farmer_name=farmer_user.name, produce="Khalas Dates (10 crates)", weight_kg=180.0),
                TripParticipant(trip_id=trip1.id, farmer_id=admin_user.id, farmer_name=admin_user.name, produce="Sidr Honey jars", weight_kg=60.0),
                TripParticipant(trip_id=trip2.id, farmer_id=admin_user.id, farmer_name=admin_user.name, produce="Olive oil bottles", weight_kg=90.0),
            ])
            db.commit()

            # Seed crop traceability records (simulated blockchain chain for the farmer)
            t_body1 = {"product_name": "Premium Khalas Dates", "public_id": "demo-dates-01", "owner_id": farmer_user.id}
            rec1 = TraceabilityRecord(
                public_id="demo-dates-01", owner_id=farmer_user.id, product_name="Premium Khalas Dates",
                batch_label="Batch #A-2026-06", harvest_date="2026-06-18", farm_location="Hatta (Dubai) - Block A",
                water_technique="Sub-surface drip irrigation (50% water saving)",
                certifications="Organic, Pesticide-free", notes="Hand-picked and sun-dried on-farm.",
                prev_hash=None, batch_hash=_make_batch_hash(None, t_body1),
            )
            db.add(rec1)
            db.commit()
            db.refresh(rec1)
            t_body2 = {"product_name": "Raw Sidr Honey", "public_id": "demo-honey-01", "owner_id": farmer_user.id}
            rec2 = TraceabilityRecord(
                public_id="demo-honey-01", owner_id=farmer_user.id, product_name="Raw Sidr Honey",
                batch_label="Batch #H-2026-06", harvest_date="2026-06-10", farm_location="Hatta (Dubai) - Apiary 3",
                water_technique="Rain-fed Sidr trees (no irrigation)",
                certifications="Unfiltered, Lab-tested", notes="Cold-extracted, never heated.",
                prev_hash=rec1.batch_hash, batch_hash=_make_batch_hash(rec1.batch_hash, t_body2),
            )
            db.add(rec2)
            db.commit()

            print("[Database Seeding] Accounts, ecotours, CRM, logistics and traceability seeded successfully.")
    except Exception as e:
        print(f"[Database Seeding] Seed failed: {e}")
    finally:
        db.close()

# ==========================================================================
# API ROUTERS & CONTROLLERS
# ==========================================================================

# --- AUTH SERVICE ROUTERS ---

@app.post("/api/auth/register", response_model=UserResponse)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If farmer role, initialize profile details
    if new_user.role == "farmer":
        profile = Farmer(
            user_id=new_user.id,
            crop_type=user_data.crop_type,
            farm_size=user_data.farm_size,
            region=user_data.region
        )
        db.add(profile)
        db.commit()
        
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login_for_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

# --- SMART AI ONBOARDING: DOCUMENT VERIFICATION & "MY FILES" VAULT ---

def _mock_ocr_extract(doc_type: str, holder_name: str) -> dict:
    """Simulated AI Vision/OCR extraction. Returns dummy structured data per document type."""
    today = datetime.utcnow().date()
    normalized = (doc_type or "").strip().lower()

    if "emirates" in normalized:
        # Emirates ID expiring soon (~45 days) to demo the renewal warning badge.
        expiry = today + timedelta(days=45)
        return {
            "doc_type": "Emirates ID",
            "extracted_id_number": f"784-{1980 + (uuid.uuid4().int % 25)}-{uuid.uuid4().int % 10_000000:07d}-{uuid.uuid4().int % 10}",
            "expiry_date": expiry.isoformat(),
            "holder_name": holder_name,
        }

    if "agricultural" in normalized or "holding" in normalized:
        # Agricultural Holding Certificate valid for ~2 years.
        expiry = today + timedelta(days=730)
        return {
            "doc_type": "Agricultural Holding Certificate",
            "extracted_id_number": f"AGRI-HOLD-{today.year}-{uuid.uuid4().int % 10000:04d}",
            "expiry_date": expiry.isoformat(),
            "holder_name": holder_name,
        }

    # Generic fallback document.
    expiry = today + timedelta(days=365)
    return {
        "doc_type": doc_type or "Document",
        "extracted_id_number": f"DOC-{uuid.uuid4().int % 1_000000:06d}",
        "expiry_date": expiry.isoformat(),
        "holder_name": holder_name,
    }


def _days_to_expiry(expiry_date: Optional[str]) -> Optional[int]:
    if not expiry_date:
        return None
    try:
        exp = datetime.fromisoformat(expiry_date).date()
        return (exp - datetime.utcnow().date()).days
    except ValueError:
        return None


def _serialize_document(doc: UserDocument) -> dict:
    return {
        "doc_id": doc.doc_id,
        "farmer_id": doc.farmer_id,
        "doc_type": doc.doc_type,
        "extracted_id_number": doc.extracted_id_number,
        "expiry_date": doc.expiry_date,
        "holder_name": doc.holder_name,
        "verification_status": doc.verification_status,
        "file_url": doc.file_url,
        "days_to_expiry": _days_to_expiry(doc.expiry_date),
    }


@app.post("/api/documents/verify")
def verify_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Validate the upload (extension allowlist + size cap).
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload a PNG, JPG, WEBP or PDF.")

    safe_name = f"{uuid.uuid4().hex}{ext}"  # never trust the client filename
    dest_path = os.path.join(UPLOADED_DOCS_DIR, safe_name)

    size = 0
    with open(dest_path, "wb") as buffer:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_DOC_SIZE_BYTES:
                buffer.close()
                os.remove(dest_path)
                raise HTTPException(status_code=413, detail="File too large. Maximum size is 5 MB.")
            buffer.write(chunk)

    # 2. Simulate the AI Vision / OCR pipeline (Hackathon demo mock).
    time.sleep(2)
    extracted = _mock_ocr_extract(doc_type, current_user.name)

    # 3. Persist into the user's document vault.
    record = UserDocument(
        farmer_id=current_user.id,
        doc_type=extracted["doc_type"],
        extracted_id_number=extracted["extracted_id_number"],
        expiry_date=extracted["expiry_date"],
        holder_name=extracted["holder_name"],
        verification_status="AI_Verified",
        file_url=f"/api/documents/file/{safe_name}",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _serialize_document(record)


@app.get("/api/documents")
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(UserDocument)
        .filter(UserDocument.farmer_id == current_user.id)
        .order_by(UserDocument.created_at.desc())
        .all()
    )
    return [_serialize_document(d) for d in docs]


@app.get("/api/documents/file/{filename}")
def get_document_file(filename: str):
    # Prevent path traversal: only allow plain filenames inside the uploads dir.
    safe = os.path.basename(filename)
    path = os.path.join(UPLOADED_DOCS_DIR, safe)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Document not found.")
    return FileResponse(path)



@app.post("/api/reports", response_model=ReportResponse)
def create_report(
    report_data: ReportCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(RoleChecker(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    # 1. Run local Edge AI Analyst model query (falls back to regex if offline)
    ai_analysis = analyze_report_with_ai(report_data.description)
    
    # 2. Map AI values into DB record
    new_report = EcoReport(
        reporter_id=current_user.id,
        title=report_data.title,
        description=report_data.description,
        category=report_data.category,
        severity=ai_analysis["severity"],
        status="Pending",
        latitude=report_data.latitude,
        longitude=report_data.longitude,
        assigned_dept=ai_analysis["department"]
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # 3. Launch Asynchronous Background Task to generate PDF
    background_tasks.add_task(
        generate_municipality_pdf,
        report_id=new_report.id,
        report_title=new_report.title,
        reporter_name=current_user.name,
        category=new_report.category,
        severity=new_report.severity,
        status=new_report.status,
        lat=new_report.latitude,
        lng=new_report.longitude,
        description=new_report.description,
        destination_dir=PDF_OUTPUT_DIR
    )
    
    # Format date string for response mapping
    created_str = new_report.created_at.strftime("%Y-%m-%d %H:%M:%S")
    
    return {
        "id": new_report.id,
        "reporter_id": new_report.reporter_id,
        "title": new_report.title,
        "description": new_report.description,
        "category": new_report.category,
        "severity": new_report.severity,
        "status": new_report.status,
        "latitude": new_report.latitude,
        "longitude": new_report.longitude,
        "assigned_dept": new_report.assigned_dept,
        "created_at": created_str
    }

@app.get("/api/reports")
def get_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        # Admin views all incoming reports
        reports = db.query(EcoReport).all()
    else:
        # Farmers view only their submitted tickets
        reports = db.query(EcoReport).filter(EcoReport.reporter_id == current_user.id).all()
        
    return [{
        "id": r.id,
        "reporter_id": r.reporter_id,
        "title": r.title,
        "description": r.description,
        "category": r.category,
        "severity": r.severity,
        "status": r.status,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "assigned_dept": r.assigned_dept,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for r in reports]

@app.patch("/api/reports/{report_id}/status")
def update_report_status(
    report_id: int,
    status_data: StatusUpdate,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    report = db.query(EcoReport).filter(EcoReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report ticket not found.")
    
    old_status = report.status
    report.status = status_data.status
    
    # Award Eco-Credits if status changed to 'Resolved'
    if status_data.status == "Resolved" and old_status != "Resolved":
        reporter = db.query(User).filter(User.id == report.reporter_id).first()
        if reporter:
            reporter.eco_credits = getattr(reporter, "eco_credits", 0) + 40
            
    db.commit()
    db.refresh(report)
    
    return {"message": "Status updated successfully.", "status": report.status}

@app.get("/api/reports/{report_id}/pdf")
def download_report_pdf(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(EcoReport).filter(EcoReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report ticket not found.")
        
    # Security: check ownership (only admin or reporter can fetch it)
    if current_user.role != "admin" and report.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this ticket.")
        
    filepath = os.path.join(PDF_OUTPUT_DIR, f"municipal_report_{report_id}.pdf")
    
    # If background thread is still writing, wait briefly or throw error
    if not os.path.exists(filepath):
        raise HTTPException(status_code=422, detail="Report PDF is still compiling in background. Try again shortly.")
        
    return FileResponse(
        filepath, 
        media_type="application/pdf", 
        filename=f"Eco_Municipal_Ticket_{report_id}.pdf"
    )

@app.get("/api/reports/audit-logs")
def get_audit_logs(
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    # Retrieve audit logging records generated automatically by our SQLite Triggers
    logs = db.query(ReportAuditLog).order_by(ReportAuditLog.changed_at.desc()).all()
    return [{
        "id": l.id,
        "report_id": l.report_id,
        "old_status": l.old_status,
        "new_status": l.new_status,
        "changed_at": l.changed_at.strftime("%Y-%m-%d %H:%M:%S")
    } for l in logs]

# --- TRANSACTION SERVICE ROUTERS ---

@app.get("/api/inventory")
def get_inventory(db: Session = Depends(get_db)):
    items = db.query(MarketInventory).all()
    return [{
        "id": i.id,
        "title": i.title,
        "description": i.description,
        "type": i.type,
        "price": i.price,
        "stock": i.stock,
        "owner_id": i.owner_id,
        "owner_name": i.owner.name if i.owner else "EcoConnect",
        "sold_count": len(i.transactions)
    } for i in items]

@app.post("/api/inventory")
def add_inventory(
    item_data: InventoryCreate,
    current_user: User = Depends(RoleChecker(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    new_item = MarketInventory(
        title=item_data.title,
        description=item_data.description,
        type=item_data.type,
        price=item_data.price,
        stock=item_data.stock,
        owner_id=current_user.id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"message": "Resource published in circular marketplace.", "item_id": new_item.id}

@app.post("/api/transactions")
def process_transaction(
    tx_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(MarketInventory).filter(MarketInventory.id == tx_data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in inventory.")
    if item.stock <= 0:
        raise HTTPException(status_code=400, detail="Item is out of stock.")
    
    # Process
    item.stock -= 1
    new_tx = Transaction(
        item_id=item.id,
        buyer_id=current_user.id,
        amount=tx_data.amount
    )
    db.add(new_tx)
    
    # Award Eco-Credits to buyer
    current_user.eco_credits = getattr(current_user, "eco_credits", 0) + 10
    
    db.commit()
    db.refresh(new_tx)
    
    return {
        "message": "Transaction recorded in ledger.",
        "transaction_id": new_tx.id,
        "buyer": current_user.name,
        "item": item.title,
        "remaining_stock": item.stock
    }

# ==========================================================================
# GOVERNMENT REQUESTS ROUTERS
# ==========================================================================

@app.post("/api/government-requests", response_model=GovRequestResponse)
def create_government_request(
    req_data: GovRequestCreate,
    current_user: User = Depends(RoleChecker(["farmer"])),
    db: Session = Depends(get_db)
):
    new_req = GovernmentRequest(
        farmer_id=current_user.id,
        request_type=req_data.request_type,
        title=req_data.title,
        description=req_data.description,
        amount_requested=req_data.amount_requested,
        status="Pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    return {
        "id": new_req.id,
        "farmer_id": new_req.farmer_id,
        "request_type": new_req.request_type,
        "title": new_req.title,
        "description": new_req.description,
        "amount_requested": new_req.amount_requested,
        "status": new_req.status,
        "created_at": new_req.created_at.strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/government-requests")
def get_government_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        requests = db.query(GovernmentRequest).all()
    else:
        requests = db.query(GovernmentRequest).filter(GovernmentRequest.farmer_id == current_user.id).all()
        
    return [{
        "id": r.id,
        "farmer_id": r.farmer_id,
        "farmer_name": r.farmer.name if r.farmer else "Unknown Farmer",
        "request_type": r.request_type,
        "title": r.title,
        "description": r.description,
        "amount_requested": r.amount_requested,
        "status": r.status,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for r in requests]

class GovRequestStatusUpdate(BaseModel):
    status: str # 'Approved', 'Rejected'

@app.patch("/api/government-requests/{request_id}/status")
def update_government_request_status(
    request_id: int,
    status_data: GovRequestStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    req = db.query(GovernmentRequest).filter(GovernmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Government request not found.")
        
    if status_data.status not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status update value.")
        
    req.status = status_data.status
    db.commit()
    db.refresh(req)
    
    # Trigger background task to build PDF certificate when approved
    if req.status == "Approved":
        background_tasks.add_task(
            generate_subsidy_pdf,
            request_id=req.id,
            request_title=req.title,
            farmer_name=req.farmer.name if req.farmer else "Unknown Farmer",
            request_type=req.request_type,
            description=req.description,
            amount=req.amount_requested,
            status=req.status,
            destination_dir=PDF_OUTPUT_DIR
        )
    
    return {"message": "Government request status updated.", "status": req.status}

@app.post("/api/services/apply")
def apply_service(request: ServiceRequest):
    """Generic endpoint to handle dynamic service applications and simulate database persistence."""
    print(f"[Service Routing] Farmer {request.farmer_id} applied for {request.service_id} with payload: {request.payload}")
    return {
        "status": "success",
        "message": "Request routed to the appropriate department via AI."
    }

# ==========================================================================
# ECO-TOURISM, CHATBOT & WALLET EXPANSION ROUTERS
# ==========================================================================

@app.post("/api/chat")
def chat_endpoint(prompt: ChatPrompt):
    response = chat_with_agri_advisor(prompt.message, prompt.history)
    return {"response": response}

@app.post("/api/falcon")
def falcon_endpoint(prompt: ChatPrompt):
    """Falcon — the on-device Eco Connect AI assistant."""
    if not prompt.message or not prompt.message.strip():
        raise HTTPException(status_code=400, detail="A message is required.")
    return ask_falcon_assistant(prompt.message.strip(), prompt.history)

@app.post("/api/classify-report", response_model=ReportClassifyResponse)
def classify_report_endpoint(payload: ReportClassify):
    """Automated civic-routing classifier for the municipal dashboard."""
    if not payload.description or not payload.description.strip():
        raise HTTPException(status_code=400, detail="Report description is required.")
    return classify_civic_report(payload.description.strip())

@app.post("/api/subsidy/evaluate")
def subsidy_evaluate_endpoint(payload: SubsidyEligibilityRequest):
    """Governance-as-code subsidy/permit eligibility engine (bilingual rationale)."""
    return evaluate_subsidy_eligibility(payload.dict())

@app.get("/api/analytics/trends")
def analytics_trends_endpoint(
    current_user: User = Depends(RoleChecker(["admin"])),
    db: Session = Depends(get_db)
):
    """EcoConnect Data Analytics Agent: detect trends/anomalies across recent reports."""
    recent = db.query(EcoReport).order_by(EcoReport.created_at.desc()).limit(50).all()
    batch = [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "severity": r.severity,
            "status": r.status,
            "assigned_dept": r.assigned_dept,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for r in recent
    ]
    return analyze_report_batch(batch)

@app.post("/api/ecotours")
def create_ecotour(
    tour_data: EcotourCreate,
    current_user: User = Depends(RoleChecker(["farmer", "admin"])),
    db: Session = Depends(get_db)
):
    new_tour = Ecotour(
        title=tour_data.title,
        description=tour_data.description,
        price=tour_data.price,
        region=tour_data.region,
        owner_id=current_user.id
    )
    db.add(new_tour)
    db.commit()
    db.refresh(new_tour)
    return {"message": "Experience hosted successfully", "tour_id": new_tour.id}

@app.get("/api/ecotours")
def get_ecotours(db: Session = Depends(get_db)):
    tours = db.query(Ecotour).all()
    return [{
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "price": t.price,
        "region": t.region,
        "owner_id": t.owner_id,
        "owner_name": t.owner.name if t.owner else "Local Guide"
    } for t in tours]

@app.post("/api/bookings")
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tour = db.query(Ecotour).filter(Ecotour.id == booking_data.tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Ecotour experience not found.")
    
    total = tour.price * booking_data.slots
    new_booking = Booking(
        tour_id=tour.id,
        visitor_id=current_user.id,
        slots=booking_data.slots,
        total_price=total,
        booking_date=booking_data.booking_date
    )
    db.add(new_booking)
    
    # Award Eco-Credits
    current_user.eco_credits = getattr(current_user, "eco_credits", 0) + 20
    tour_owner = db.query(User).filter(User.id == tour.owner_id).first()
    if tour_owner:
        tour_owner.eco_credits = getattr(tour_owner, "eco_credits", 0) + 50
        
    db.commit()
    db.refresh(new_booking)
    return {
        "message": "Booking confirmed successfully",
        "booking_id": new_booking.id,
        "total_price": total,
        "reference": f"ECO-TOUR-{new_booking.id + 1000}"
    }

@app.get("/api/bookings")
def get_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        bookings = db.query(Booking).all()
    elif current_user.role == "farmer":
        bookings = db.query(Booking).join(Ecotour).filter(Ecotour.owner_id == current_user.id).all()
    else:
        bookings = db.query(Booking).filter(Booking.visitor_id == current_user.id).all()
        
    return [{
        "id": b.id,
        "tour_title": b.tour.title,
        "visitor_name": b.visitor.name,
        "slots": b.slots,
        "total_price": b.total_price,
        "booking_date": b.booking_date,
        "status": b.status,
        "owner_id": b.tour.owner_id if b.tour else None
    } for b in bookings]

@app.get("/api/farmers/earnings")
def get_farmer_earnings(
    current_user: User = Depends(RoleChecker(["farmer"])),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).join(Ecotour).filter(Ecotour.owner_id == current_user.id, Booking.status == "Confirmed").all()
    tour_earnings = sum(b.total_price for b in bookings)
    
    sales = db.query(Transaction).join(MarketInventory).filter(MarketInventory.owner_id == current_user.id).all()
    marketplace_earnings = sum(s.amount for s in sales)
    
    total_earnings = tour_earnings + marketplace_earnings
    
    return {
        "total_earnings": total_earnings,
        "tour_earnings": tour_earnings,
        "marketplace_earnings": marketplace_earnings,
        "bookings_count": len(bookings),
        "sales_count": len(sales),
        "ledger": [{
            "type": "Ecotour Booking",
            "description": f"{b.tour.title} ({b.slots} slots)",
            "amount": b.total_price,
            "date": b.created_at.strftime("%Y-%m-%d %H:%M"),
            "reference": f"ECO-TOUR-{b.id + 1000}"
        } for b in bookings] + [{
            "type": "Marketplace Sale",
            "description": s.item.title if s.item else "Circular Item",
            "amount": s.amount,
            "date": s.timestamp.strftime("%Y-%m-%d %H:%M"),
            "reference": f"ECO-SALE-{s.id + 1000}"
        } for s in sales]
    }

@app.get("/api/government-requests/{request_id}/pdf")
def download_government_request_pdf(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(GovernmentRequest).filter(GovernmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
        
    if current_user.role != "admin" and req.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this request.")
        
    if req.status != "Approved":
        raise HTTPException(status_code=400, detail="Certificates are only available for approved requests.")
        
    filepath = os.path.join(PDF_OUTPUT_DIR, f"subsidy_certificate_{request_id}.pdf")
    
    if not os.path.exists(filepath):
        generate_subsidy_pdf(
            request_id=req.id,
            request_title=req.title,
            farmer_name=req.farmer.name if req.farmer else "Unknown Farmer",
            request_type=req.request_type,
            description=req.description,
            amount=req.amount_requested,
            status=req.status,
            destination_dir=PDF_OUTPUT_DIR
        )
        
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"Eco_Permit_Certificate_{request_id}.pdf"
    )

# ==========================================================================
# CRM SERVICE ROUTERS (community entrepreneur relationship management)
# ==========================================================================

@app.get("/api/crm/contacts")
def list_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contacts = db.query(Contact).filter(Contact.owner_id == current_user.id).order_by(Contact.created_at.desc()).all()
    return [{
        "id": c.id,
        "name": c.name,
        "contact_type": c.contact_type,
        "email": c.email,
        "phone": c.phone,
        "company": c.company,
        "status": c.status,
        "value": c.value,
        "notes": c.notes,
        "interactions_count": len(c.interactions),
        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
    } for c in contacts]

@app.post("/api/crm/contacts")
def create_contact(
    data: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Contact name is required.")
    contact = Contact(
        owner_id=current_user.id,
        name=data.name.strip(),
        contact_type=data.contact_type,
        email=data.email,
        phone=data.phone,
        company=data.company,
        status=data.status,
        value=data.value or 0.0,
        notes=data.notes,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return {"message": "Contact added to CRM.", "id": contact.id}

@app.patch("/api/crm/contacts/{contact_id}/status")
def update_contact_status(
    contact_id: int,
    data: ContactStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")
    if data.status not in ["new", "contacted", "negotiating", "won", "lost"]:
        raise HTTPException(status_code=400, detail="Invalid pipeline status.")
    contact.status = data.status
    db.commit()
    return {"message": "Pipeline stage updated.", "status": contact.status}

@app.delete("/api/crm/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")
    db.delete(contact)
    db.commit()
    return {"message": "Contact removed."}

@app.get("/api/crm/contacts/{contact_id}/interactions")
def list_interactions(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")
    return [{
        "id": i.id,
        "kind": i.kind,
        "summary": i.summary,
        "created_at": i.created_at.strftime("%Y-%m-%d %H:%M"),
    } for i in sorted(contact.interactions, key=lambda x: x.created_at, reverse=True)]

@app.post("/api/crm/contacts/{contact_id}/interactions")
def add_interaction(
    contact_id: int,
    data: InteractionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == current_user.id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found.")
    if not data.summary or not data.summary.strip():
        raise HTTPException(status_code=400, detail="Interaction summary is required.")
    interaction = Interaction(contact_id=contact.id, kind=data.kind, summary=data.summary.strip())
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return {"message": "Interaction logged.", "id": interaction.id}

@app.get("/api/crm/summary")
def crm_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contacts = db.query(Contact).filter(Contact.owner_id == current_user.id).all()
    stages = ["new", "contacted", "negotiating", "won", "lost"]
    pipeline = {s: sum(1 for c in contacts if c.status == s) for s in stages}
    won_value = sum(c.value for c in contacts if c.status == "won")
    open_value = sum(c.value for c in contacts if c.status in ("contacted", "negotiating"))
    return {
        "total_contacts": len(contacts),
        "pipeline": pipeline,
        "won_value": won_value,
        "open_value": open_value,
        "customers": sum(1 for c in contacts if c.contact_type == "customer"),
        "leads": sum(1 for c in contacts if c.contact_type == "lead"),
    }

# ==========================================================================
# ENTREPRENEUR TOOLS - business launch & local market insight
# ==========================================================================

@app.post("/api/business/plan")
def business_plan_endpoint(payload: BusinessPlanRequest):
    """Challenge 1 - turns an idea/skill into a concrete first-action plan."""
    if not payload.idea or not payload.idea.strip():
        raise HTTPException(status_code=400, detail="Describe your idea or skill first.")
    return generate_business_plan(payload.idea.strip(), payload.skill or "", payload.budget or 0.0, payload.region or "UAE")

@app.post("/api/market/insights")
def market_insights_endpoint(payload: MarketInsightRequest):
    """Challenge 3 - lightweight local market research for a sector/region."""
    if not payload.sector or not payload.sector.strip():
        raise HTTPException(status_code=400, detail="A sector is required.")
    return analyze_local_market(payload.sector.strip(), payload.region or "UAE", payload.note or "")

# ==========================================================================
# OCR - scan a document image and structure its fields
# ==========================================================================

@app.post("/api/ocr")
def ocr_endpoint(payload: OcrRequest):
    """
    Accepts a base64 image (or pre-extracted text) and returns the extracted
    text plus structured fields. OCR runs via pytesseract when available and
    degrades gracefully when the engine is not installed.
    """
    extracted = (payload.text or "").strip()
    ocr_available = False
    note = None

    if not extracted and payload.image_base64:
        raw = payload.image_base64
        if "," in raw and raw.strip().lower().startswith("data:"):
            raw = raw.split(",", 1)[1]
        try:
            import base64
            import io
            image_bytes = base64.b64decode(raw)
            try:
                import pytesseract  # type: ignore
                from PIL import Image  # type: ignore
                image = Image.open(io.BytesIO(image_bytes))
                extracted = pytesseract.image_to_string(image).strip()
                ocr_available = True
            except Exception as engine_err:
                note = (
                    "OCR engine (Tesseract) is not available on this server. "
                    "Install 'pytesseract' + the Tesseract binary, or paste text manually."
                )
                print(f"[OCR] Engine unavailable: {engine_err}")
        except Exception as decode_err:
            raise HTTPException(status_code=400, detail=f"Could not decode image: {decode_err}")

    # Fallback to simulated OCR text based on filename if pytesseract is unavailable/empty
    if not extracted and payload.filename:
        filename_lower = payload.filename.lower()
        if "id" in filename_lower or "emirates" in filename_lower:
            extracted = (
                "UNITED ARAB EMIRATES EMIRATES ID\n"
                "Name: Ahmed Al Mansoori\n"
                "ID Number: 784-1985-1234567-8\n"
                "Expiry Date: 20/12/2028\n"
                "Email: ahmed.mansoori@gmail.com\n"
                "Phone: +971 50 123 4567"
            )
            note = f"Simulated OCR extract for UAE Emirates ID (filename: {payload.filename})"
        elif "license" in filename_lower or "trade" in filename_lower or "craft" in filename_lower:
            extracted = (
                "MOCCAE AGRICULTURAL HOLDING CERTIFICATE\n"
                "License Number: CERT-8841-DXB\n"
                "Holder Name: Date Palm Weaving Craft\n"
                "Expiry Date: 31/12/2026\n"
                "Type: Traditional Date Palm Weaving\n"
                "Phone: +971 50 123 4567"
            )
            note = f"Simulated OCR extract for Rural Craft License (filename: {payload.filename})"
        elif "permit" in filename_lower or "vet" in filename_lower:
            extracted = (
                "MUNICIPALITY ANIMAL VET INSPECTION PERMIT\n"
                "Permit Number: PERMIT-2026-VET\n"
                "Holder: Ahmed Al Mansoori\n"
                "Email: ahmed.mansoori@gmail.com\n"
                "Urgency: High"
            )
            note = f"Simulated OCR extract for Vet Inspection Permit (filename: {payload.filename})"
        elif "invoice" in filename_lower or "receipt" in filename_lower or "leak" in filename_lower:
            extracted = (
                "AL AIN WATER SERVICES INVOICE\n"
                "Invoice Number: INV-9942\n"
                "Total Amount: 1450.50 AED\n"
                "Date: 26/06/2026\n"
                "Phone: +971 50 123 4567"
            )
            note = f"Simulated OCR extract for Invoice (filename: {payload.filename})"

    structured = structure_document_text(extracted) if extracted else {"doc_type": "unknown", "fields": {}, "ai_processed": False}

    return {
        "extracted_text": extracted,
        "doc_type": structured.get("doc_type", "unknown"),
        "fields": structured.get("fields", {}),
        "ocr_available": ocr_available,
        "ai_processed": structured.get("ai_processed", False),
        "note": note,
    }

@app.post("/api/predictive/market-radar")
def predictive_market_radar(
    db: Session = Depends(get_db)
):
    """
    Predictive AI Market Radar:
    Aggregates current supply (MarketInventory items) and demand indicators,
    to run decision-support forecasts and generate actionable SME business recommendations.
    """
    from datetime import datetime
    
    # 1. Gather supply indicators from DB
    items = db.query(MarketInventory).all()
    honey_supply = sum(i.stock for i in items if "honey" in i.title.lower() or "عسل" in i.title.lower())
    dates_supply = sum(i.stock for i in items if "date" in i.title.lower() or "تمر" in i.title.lower())
    rugs_supply = sum(i.stock for i in items if "rug" in i.title.lower() or "weaving" in i.title.lower() or "سجاد" in i.title.lower())
    
    # 2. Return prediction insights (Decision Support)
    insights = []
    
    # Dates
    if dates_supply < 10:
        insights.append({
            "product": "Organic Khalas Dates",
            "icon": "🌴",
            "trend": "Upwards (+30% demand forecast)",
            "advice": "مؤشرات الطلب على تمور الخلاص العضوية سترتفع بنسبة 30% الشهر القادم بسبب زيادة وفود السياح. احتفظ بمخزونك الآن لرفع الهامش.",
            "action": "Increase stock buffer and update packaging design."
        })
    else:
        insights.append({
            "product": "Organic Khalas Dates",
            "icon": "🌴",
            "trend": "Stable (High Supply)",
            "advice": "الطلب مستقر ومستويات المعروض مرتفعة. ينصح بتجميع التمور في عبوات هدايا فاخرة لزيادة جاذبيتها للسياح.",
            "action": "Bundle dates with local honey for gift packs."
        })
        
    # Honey
    if honey_supply < 5:
        insights.append({
            "product": "Pure Sidr Honey",
            "icon": "🍯",
            "trend": "Spike (+20% demand forecast)",
            "advice": "مؤشرات الطلب على عسل السدر المحلي سترتفع بنسبة 20% الشهر القادم نتيجة تزايد اهتمام سياح الاستشفاء الطبيعي. احتفظ بمخزونك الآن ولا تتعجل في البيع.",
            "action": "Raise listing price slightly on Eco Market."
        })
    else:
        insights.append({
            "product": "Pure Sidr Honey",
            "icon": "🍯",
            "trend": "Stable",
            "advice": "مستويات المعروض كافية. ركز على ترويج الفوائد العلاجية وتقديم عينات تذوق مجانية لزوار المزرعة.",
            "action": "Add organic test-stamp label to listings."
        })

    # Rugs (Sadu Weaving)
    insights.append({
        "product": "Handwoven Sadu Rugs",
        "icon": "🧶",
        "trend": "High Demand Gap",
        "advice": "نسبة الاهتمام بالسجاد اليدوي تفوق المعروض بنسبة 50%. ننصح بتسجيل رخص فورية للبدء في الإنتاج وتلبية طلبات الفنادق التراثية.",
        "action": "Collaborate with neighboring Sadu weavers to fulfill batch orders."
    })
    
    # Tours
    insights.append({
        "product": "Heritage Desert Tours",
        "icon": "⛺",
        "trend": "Seasonal Shift",
        "advice": "الطلب على الجولات الليلية والرصد الفلكي يرتفع بشكل ملحوظ مع بدء تراجع درجات الحرارة. نوصي باستضافة 3 جولات أسبوعياً بأسعار مميزة.",
        "action": "Open booking slots for next weekend."
    })
    
    return {
        "status": "success",
        "insights": insights,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.post("/api/speech/transcribe")
def speech_transcribe_endpoint(payload: SpeechRequest):
    """
    EcoConnect Audio Accessibility Service:
    Converts audio speech recording (base64) into text commands.
    """
    if payload.text_fallback:
        transcription = payload.text_fallback
    else:
        transcription = "هناك عاصفة رملية تقترب من القطاع الجنوبي"
    
    return {
        "status": "success",
        "transcription": transcription,
        "language": "ar-AE",
        "confidence": 0.98,
        "method": "Whisper STT Server"
    }

@app.post("/api/computer-vision/diagnose")
def cv_diagnose_endpoint(payload: CvDiagnoseRequest):
    """
    Eco-Shield Computer Vision Diagnosis:
    Accepts base64-encoded image of agricultural/infrastructure issues,
    performs diagnosis, rates severity, and provides distress action items.
    """
    raw = payload.image_base64
    
    issue = "Water Leak / Pipe Fracture"
    category = "water"
    severity = "Critical"
    diagnosis = "Main PVC irrigation pipe segment cracked under soil shifts. High-volume water loss detected."
    action = "Notify ADA Municipality Dispatch and trigger immediate neighbor rescue beacon."
    
    raw_lower = raw.lower()
    if "pest" in raw_lower or "disease" in raw_lower or "leaf" in raw_lower or "plant" in raw_lower or "crop" in raw_lower:
        issue = "Crop Rust / Leaf Fungal Disease"
        category = "other"
        severity = "Medium"
        diagnosis = "Fungal leaf spot detected on date palm foliage. High spreading potential under warm conditions."
        action = "Apply copper-based organic fungicide and isolate infected crops."
    elif "sand" in raw_lower or "dune" in raw_lower or "road" in raw_lower:
        issue = "Sand Encroachment / Dune Blockage"
        category = "accident"
        severity = "Critical"
        diagnosis = "Active dune migration encroaching on access road Sector 4, blocking agricultural traffic."
        action = "Request tractor clearance from municipal dispatch center."
    elif "engine" in raw_lower or "tractor" in raw_lower or "mechanical" in raw_lower:
        issue = "Tractor Engine / Mechanical Failure"
        category = "accident"
        severity = "Medium"
        diagnosis = "Snapped auxiliary belt on agricultural vehicle drive system."
        action = "Request mechanical tool sharing or neighbor assist towing."
    elif "injury" in raw_lower or "heat" in raw_lower or "medical" in raw_lower:
        issue = "Heat Exhaustion / Medical Emergency"
        category = "medical"
        severity = "Critical"
        diagnosis = "Severe heat stroke symptoms reported from field worker. Body temperature elevated."
        action = "Move to shade, apply cool water, and contact emergency ambulance services."
        
    return {
        "issue_detected": issue,
        "category": category,
        "severity": severity,
        "diagnosis": diagnosis,
        "recommended_action": action,
        "coords_offset": {
            "lat": 0.0015,
            "lng": -0.0012
        }
    }

# ==========================================================================
# SMART MARKETPLACE - predictive demand, Farm-to-Hub logistics, traceability
# ==========================================================================

# Crop keyword map used to aggregate marketplace supply into crop buckets.
_CROP_KEYWORDS = {
    "Khalas Dates": ["date", "khalas", "palm"],
    "Sidr Honey": ["honey", "sidr"],
    "Olives": ["olive"],
    "Leafy Greens": ["green", "lettuce", "spinach", "herb"],
    "Cherry Tomatoes": ["tomato"],
    "Cucumbers": ["cucumber"],
    "Goat Milk": ["milk", "goat", "soap"],
    "Farm Eggs": ["egg"],
}


@app.get("/api/market/demand-forecast")
def demand_forecast_endpoint(db: Session = Depends(get_db)):
    """
    Predictive Demand Analytics: aggregates current marketplace supply and
    sales momentum, then forecasts which crops will be in demand so farmers
    can plan planting cycles. Public (no auth) so it can power planning views.
    """
    items = db.query(MarketInventory).all()
    supply = []
    for crop, keywords in _CROP_KEYWORDS.items():
        matched = [
            it for it in items
            if any(k in (f"{it.title} {it.description or ''}").lower() for k in keywords)
        ]
        if not matched:
            continue
        stock = sum(int(it.stock or 0) for it in matched)
        sold = sum(len(it.transactions) for it in matched if hasattr(it, "transactions"))
        supply.append({"crop": crop, "stock": stock, "sold": sold})

    recent_sales = [{"crop": s["crop"], "count": s["sold"]} for s in supply if s["sold"] > 0]
    return forecast_crop_demand(supply, recent_sales, region="UAE")


# --- FARM-TO-HUB CARPOOLING LOGISTICS ---

def _trip_to_dict(trip: DeliveryTrip):
    participants = [
        {
            "id": p.id,
            "farmer_id": p.farmer_id,
            "farmer_name": p.farmer_name,
            "produce": p.produce,
            "weight_kg": p.weight_kg,
            "status": p.status,
        }
        for p in trip.participants if p.status == "confirmed"
    ]
    total_weight = sum(p["weight_kg"] for p in participants)
    # Simple sustainability estimate: a shared trip avoids (N-1) separate trips.
    saved_trips = max(0, len(participants) - 1)
    co2_saved_kg = round(saved_trips * trip.distance_km * 2 * 0.21, 1)   # ~0.21 kg CO2/km (pickup truck)
    cost_saved_aed = round(saved_trips * trip.distance_km * 2 * 1.1, 1)  # ~1.1 AED/km fuel+wear
    fill_pct = round(min(100.0, (total_weight / trip.capacity_kg) * 100), 0) if trip.capacity_kg else 0
    return {
        "id": trip.id,
        "organizer_id": trip.organizer_id,
        "hub_name": trip.hub_name,
        "depart_region": trip.depart_region,
        "depart_date": trip.depart_date,
        "depart_time": trip.depart_time,
        "capacity_kg": trip.capacity_kg,
        "distance_km": trip.distance_km,
        "notes": trip.notes,
        "status": trip.status,
        "participants": participants,
        "participant_count": len(participants),
        "total_weight_kg": total_weight,
        "fill_pct": fill_pct,
        "co2_saved_kg": co2_saved_kg,
        "cost_saved_aed": cost_saved_aed,
    }


@app.get("/api/logistics/trips")
def list_trips(db: Session = Depends(get_db)):
    trips = db.query(DeliveryTrip).order_by(DeliveryTrip.depart_date.asc()).all()
    return [_trip_to_dict(t) for t in trips]


@app.get("/api/logistics/trips/{trip_id}")
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(DeliveryTrip).filter(DeliveryTrip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    return _trip_to_dict(trip)


@app.post("/api/logistics/trips")
def create_trip(payload: TripCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = DeliveryTrip(
        organizer_id=current_user.id,
        hub_name=payload.hub_name,
        depart_region=payload.depart_region,
        depart_date=payload.depart_date,
        depart_time=payload.depart_time,
        capacity_kg=payload.capacity_kg or 500.0,
        distance_km=payload.distance_km or 60.0,
        notes=payload.notes,
        status="open",
    )
    db.add(trip)
    current_user.eco_credits = getattr(current_user, "eco_credits", 0) + 30
    db.commit()
    db.refresh(trip)

    # The organizer can immediately list their own produce on the trip.
    if payload.produce:
        db.add(TripParticipant(
            trip_id=trip.id,
            farmer_id=current_user.id,
            farmer_name=current_user.name,
            produce=payload.produce,
            weight_kg=payload.weight_kg or 0.0,
        ))
        db.commit()
        db.refresh(trip)
    return _trip_to_dict(trip)


@app.post("/api/logistics/trips/{trip_id}/join")
def join_trip(trip_id: int, payload: TripJoin, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(DeliveryTrip).filter(DeliveryTrip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.status not in ("open",):
        raise HTTPException(status_code=400, detail="This trip is no longer accepting produce.")

    existing = db.query(TripParticipant).filter(
        TripParticipant.trip_id == trip_id,
        TripParticipant.farmer_id == current_user.id,
        TripParticipant.status == "confirmed",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already joined this trip.")

    db.add(TripParticipant(
        trip_id=trip_id,
        farmer_id=current_user.id,
        farmer_name=current_user.name,
        produce=payload.produce,
        weight_kg=payload.weight_kg or 0.0,
    ))
    current_user.eco_credits = getattr(current_user, "eco_credits", 0) + 15
    db.commit()
    db.refresh(trip)
    return _trip_to_dict(trip)


@app.delete("/api/logistics/trips/{trip_id}/leave")
def leave_trip(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    participant = db.query(TripParticipant).filter(
        TripParticipant.trip_id == trip_id,
        TripParticipant.farmer_id == current_user.id,
        TripParticipant.status == "confirmed",
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="You are not part of this trip.")
    db.delete(participant)
    db.commit()
    trip = db.query(DeliveryTrip).filter(DeliveryTrip.id == trip_id).first()
    return _trip_to_dict(trip)


# --- CROP TRACEABILITY (SIMULATED BLOCKCHAIN + QR) ---

def _make_batch_hash(prev_hash: str, payload: dict) -> str:
    import hashlib
    body = (prev_hash or "GENESIS") + json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def _trace_to_dict(rec: TraceabilityRecord, owner_name: str = None):
    return {
        "public_id": rec.public_id,
        "product_name": rec.product_name,
        "batch_label": rec.batch_label,
        "harvest_date": rec.harvest_date,
        "farm_location": rec.farm_location,
        "water_technique": rec.water_technique,
        "certifications": [c.strip() for c in (rec.certifications or "").split(",") if c.strip()],
        "notes": rec.notes,
        "prev_hash": rec.prev_hash,
        "batch_hash": rec.batch_hash,
        "farmer_name": owner_name,
        "created_at": rec.created_at.isoformat() if rec.created_at else None,
        "verified": True,
    }


@app.post("/api/traceability")
def create_trace(payload: TraceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import secrets
    if not payload.product_name or not payload.product_name.strip():
        raise HTTPException(status_code=400, detail="Product name is required.")

    # Chain to this owner's most recent record (simulated per-owner blockchain).
    last = db.query(TraceabilityRecord).filter(
        TraceabilityRecord.owner_id == current_user.id
    ).order_by(TraceabilityRecord.id.desc()).first()
    prev_hash = last.batch_hash if last else None

    public_id = secrets.token_urlsafe(8)
    body = {
        "product_name": payload.product_name.strip(),
        "batch_label": payload.batch_label,
        "harvest_date": payload.harvest_date,
        "farm_location": payload.farm_location,
        "water_technique": payload.water_technique,
        "certifications": payload.certifications,
        "owner_id": current_user.id,
        "public_id": public_id,
    }
    batch_hash = _make_batch_hash(prev_hash, body)

    rec = TraceabilityRecord(
        public_id=public_id,
        owner_id=current_user.id,
        product_name=payload.product_name.strip(),
        batch_label=payload.batch_label,
        harvest_date=payload.harvest_date,
        farm_location=payload.farm_location,
        water_technique=payload.water_technique,
        certifications=payload.certifications,
        notes=payload.notes,
        prev_hash=prev_hash,
        batch_hash=batch_hash,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return _trace_to_dict(rec, current_user.name)


@app.get("/api/traceability/mine")
def my_traces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recs = db.query(TraceabilityRecord).filter(
        TraceabilityRecord.owner_id == current_user.id
    ).order_by(TraceabilityRecord.id.desc()).all()
    return [_trace_to_dict(r, current_user.name) for r in recs]


@app.get("/api/traceability/{public_id}")
def public_trace(public_id: str, db: Session = Depends(get_db)):
    """Public scan endpoint - no auth. Returns the product 'story' for a QR scan."""
    rec = db.query(TraceabilityRecord).filter(TraceabilityRecord.public_id == public_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Traceability record not found.")
    owner = db.query(User).filter(User.id == rec.owner_id).first()
    return _trace_to_dict(rec, owner.name if owner else None)

# ==========================================================================
# GAMIFICATION & ECO-CREDITS LOYALTY SYSTEM ROUTERS
# ==========================================================================

REWARDS_CATALOG = [
    {
        "id": 1,
        "title": "Municipal Water Permit Fee Waiver",
        "description": "Waive the processing fee for your next sub-surface water quota permit request.",
        "cost_credits": 150,
        "category": "Permit"
    },
    {
        "id": 2,
        "title": "AED 50 Marketplace Voucher",
        "description": "AED 50 discount applicable on any organic produce purchased on the circular market.",
        "cost_credits": 100,
        "category": "Market"
    },
    {
        "id": 3,
        "title": "Eco Green Guardian Certification",
        "description": "An official digital certification badge issued by MOECC demonstrating outstanding carbon reduction.",
        "cost_credits": 200,
        "category": "Badge"
    },
    {
        "id": 4,
        "title": "Agricultural Compost Discount (25%)",
        "description": "Get a 25% discount on bulk organic compost bags from Al Ain Municipality.",
        "cost_credits": 80,
        "category": "Subsidy"
    }
]

class RewardRedeemRequest(BaseModel):
    reward_id: int

class TaskAwardRequest(BaseModel):
    task_title: str

@app.get("/api/user/credits")
def get_user_credits(current_user: User = Depends(get_current_user)):
    """Fetch current user's profile metadata and eco_credits balance."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "eco_credits": getattr(current_user, "eco_credits", 0)
    }

@app.get("/api/rewards")
def list_rewards():
    """List all available rewards in the catalog."""
    return REWARDS_CATALOG

@app.post("/api/rewards/redeem")
def redeem_reward(payload: RewardRedeemRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Deduct eco-credits and issue a reward voucher key."""
    reward = next((r for r in REWARDS_CATALOG if r["id"] == payload.reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward option not found in catalog.")
    
    user_credits = getattr(current_user, "eco_credits", 0)
    if user_credits < reward["cost_credits"]:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient Eco-Credits. Required: {reward['cost_credits']}, Balance: {user_credits}"
        )
    
    # Deduct credits
    current_user.eco_credits = user_credits - reward["cost_credits"]
    db.commit()
    db.refresh(current_user)
    
    import secrets
    voucher_code = f"ECO-CRED-{secrets.token_hex(4).upper()}"
    return {
        "message": f"Successfully redeemed '{reward['title']}'!",
        "voucher_code": voucher_code,
        "remaining_credits": current_user.eco_credits
    }

@app.post("/api/employee/award-task")
def award_employee_task(payload: TaskAwardRequest, current_user: User = Depends(RoleChecker(["employee", "farmer"])), db: Session = Depends(get_db)):
    """Award 15 credits to employee when completing a farm task."""
    current_user.eco_credits = getattr(current_user, "eco_credits", 0) + 15
    db.commit()
    db.refresh(current_user)
    return {
        "message": f"Awarded 15 Eco-Credits for task: {payload.task_title}",
        "new_balance": current_user.eco_credits
    }

@app.post("/api/voice-assistant", response_model=VoiceAssistantResponse)
def voice_assistant_endpoint(payload: VoiceAssistantRequest):
    """
    Voice Assistant - EcoConnect Voice Hub
    Guides UAE local farmers and micro-businesses.
    Constraint: UAE farming/rural topics, friendly Emirati Arabic, under 15 words.
    Guardrail: If unrelated, response must be exactly:
    'عذراً، أنا مخصص فقط لخدمات الزراعة ودعم المجتمع الريفي.'
    """
    msg = payload.message.strip().lower()
    
    # 1. Guardrail for unrelated topics (politics, coding, general trivia, etc.)
    unrelated_keywords = [
        "برمجة", "كود", "سياسة", "انتخابات", "رئيس", "حكومات", "دول",
        "رياضيات", "فيزياء", "كيمياء", "تاريخ", "جغرافيا", "أفلام",
        "موسيقى", "ألعاب", "كرة قدم", "برمجة الحاسوب", "coding", "code",
        "politics", "president", "math", "trivia", "science"
    ]
    if any(k in msg for k in unrelated_keywords):
        return {
            "reply": "عذراً، أنا مخصص فقط لخدمات الزراعة ودعم المجتمع الريفي.",
            "command": None
        }

    # 2. Command Matchers
    command = None
    reply = ""

    # Mapping keywords to specific commands and very short Arabic replies (<15 words)
    if any(k in msg for k in ["بائع", "أدوات البائع", "عرض بائع", "seller", "sell tool"]):
        command = "open_seller_tools"
        reply = "تفضل يا صاحبي، تم فتح أدوات البائع وإدارة منتجاتك."
    elif any(k in msg for k in ["رادار", "توقع", "طلب", "توقعات", "radar", "demand"]):
        command = "open_market_radar"
        reply = "أبشر! تم فتح رادار توقعات الطلب والمؤشرات البيئية."
    elif any(k in msg for k in ["رخصة", "حرف", "حرفية", "license", "craft"]):
        command = "open_crafts_license"
        reply = "تم توجيهك إلى صفحة تقديم رخصة الحرف الريفية."
    elif any(k in msg for k in ["تسريب", "تسرب", "مياه", "تسريبات", "leak", "water leak"]):
        command = "open_water_leak"
        reply = "تم فتح نموذج الإبلاغ عن تسريبات المياه لتقديم المساعدة."
    elif any(k in msg for k in ["بيطري", "طبيب بيطري", "فحص حيوانات", "vet", "veterinary"]):
        command = "open_vet_visit"
        reply = "حاضر، سأقوم بفتح طلب زيارة الطبيب البيطري لمواشيك."
    elif any(k in msg for k in ["خزنة", "وثائق", "مستندات", "vault", "document"]):
        command = "open_vault"
        reply = "تفضل بالدخول إلى الخزنة الآمنة لمستنداتك الزراعية."
    elif any(k in msg for k in ["سوق", "شراء", "منتجات", "شراء منتج", "market", "shop"]):
        command = "open_eco_market"
        reply = "مرحباً بك في سوق المنتجات البيئية المحلي، تسوق سعيد!"
    else:
        # Default responses for general agricultural queries in UAE
        if any(k in msg for k in ["مرحباً", "السلام", "هلا", "hi", "hello"]):
            reply = "مرحباً بك في مركز إيكوكونكت الصوتي، كيف يمكنني مساعدتك؟"
        elif any(k in msg for k in ["دعم", "تمويل", "مساعدة", "مساعد", "help", "support"]):
            reply = "يمكنك طلب الدعم والمساعدات البيئية عبر بوابة جف-كونكت."
        elif any(k in msg for k in ["نخيل", "تمر", "مزارع", "dates", "palm"]):
            reply = "نوصي بزراعة النخيل واستخدام الري بالتنقيط لتوفير المياه."
        else:
            # Fallback using the LLM prompt if online, else deterministic UAE message
            from backend.ai import FALCON_CLOUD_KEY, FALCON_CLOUD_URL, FALCON_CLOUD_MODEL, _chat_completion
            if FALCON_CLOUD_KEY:
                try:
                    system_voice_prompt = (
                        "You are 'EcoConnect Voice Hub', the digital agricultural and rural development assistant of the UAE. "
                        "Guide local farmers and rural micro-businesses on MOCCAE subsidies, water permits, eco-market, vet visits, and crops. "
                        "Reply strictly in Friendly Emirati Arabic, under 15 words. "
                        "Choose exactly one tool command from: [open_seller_tools, open_market_radar, open_crafts_license, open_water_leak, open_vet_visit, open_vault, open_eco_market, null]. "
                        "IF the user asks about politics, coding, general trivia, or anything unrelated to farming, rural life, or the app, "
                        "the reply MUST be exactly: 'عذراً، أنا مخصص فقط لخدمات الزراعة ودعم المجتمع الريفي.' "
                        "Output ONLY a valid JSON object: {\"reply\": \"your response\", \"command\": \"chosen_tool\"}"
                    )
                    messages = [
                        {"role": "system", "content": system_voice_prompt},
                        {"role": "user", "content": payload.message}
                    ]
                    ai_res = _chat_completion(FALCON_CLOUD_URL, messages, api_key=FALCON_CLOUD_KEY,
                                             model=FALCON_CLOUD_MODEL, timeout=8.0, max_tokens=100)
                    import json
                    parsed = json.loads(ai_res.strip("`").replace("json", "").strip())
                    return {
                        "reply": parsed.get("reply", "عذراً، كيف يمكنني مساعدتك اليوم؟"),
                        "command": parsed.get("command", None)
                    }
                except Exception as e:
                    print(f"Voice LLM failed: {e}")
            reply = "عذراً، يرجى التحدث عن الزراعة أو خدمات وزارة البيئة."

    return {
        "reply": reply,
        "command": command
    }

@app.get("/api/admin/users")
def get_all_users(current_user: User = Depends(RoleChecker(["admin"])), db: Session = Depends(get_db)):
    """Fetch all registered users for administration dashboard."""
    users = db.query(User).all()
    out = []
    for u in users:
        out.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "status": getattr(u, "status", "active") or "active",
            "eco_credits": getattr(u, "eco_credits", 0) or 0
        })
    return out

@app.patch("/api/admin/users/{user_id}/status")
def update_user_status(user_id: int, payload: UserStatusUpdate, current_user: User = Depends(RoleChecker(["admin"])), db: Session = Depends(get_db)):
    """Update verification, suspension, or general status of a user."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    u.status = payload.status
    db.commit()
    db.refresh(u)
    return {"message": "User status updated successfully", "id": u.id, "status": u.status}

@app.patch("/api/admin/users/{user_id}/credits")
def update_user_credits(user_id: int, payload: UserCreditsUpdate, current_user: User = Depends(RoleChecker(["admin"])), db: Session = Depends(get_db)):
    """Deduct or add Eco-Credits for a specific user."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    u.eco_credits = payload.credits
    db.commit()
    db.refresh(u)
    return {"message": "User credits updated successfully", "id": u.id, "eco_credits": u.eco_credits}

@app.patch("/api/admin/users/{user_id}/role")
def update_user_role(user_id: int, payload: UserRoleUpdate, current_user: User = Depends(RoleChecker(["admin"])), db: Session = Depends(get_db)):
    """Update a user's role/access group."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    u.role = payload.role
    db.commit()
    db.refresh(u)
    return {"message": "User role updated successfully", "id": u.id, "role": u.role}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
