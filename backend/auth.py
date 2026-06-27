import os
import base64
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User

# JWT Parameters
SECRET_KEY = os.getenv("ECO_SECRET_KEY", "eco_connect_secret_key_uae_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==========================================================================
# ROBUST PASSWORD HASHING (PBKDF2-SHA256)
# ==========================================================================

SALT = b"eco_salt_3984"

def get_password_hash(password: str) -> str:
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), SALT, 10000)
    return "pbkdf2_sha256$" + base64.b64encode(h).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password.startswith("pbkdf2_sha256$"):
        # Catch and verify old hashes in case bcrypt was generated previously
        try:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    stored_h = base64.b64decode(hashed_password.split("$")[1])
    test_h = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), SALT, 10000)
    return hmac.compare_digest(stored_h, test_h)

try:
    # Attempt standard PyJWT
    import jwt
    
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def decode_access_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
except ImportError:
    # Secure built-in HS256 JWT encoder/decoder fallback
    print("[Auth Service] 'jose' / 'pyjwt' not found. Using local Base64/HMAC signature token fallback.")
    
    def base64_url_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode().rstrip("=")
        
    def base64_url_decode(data: str) -> bytes:
        padding = "=" * (4 - (len(data) % 4))
        return base64.urlsafe_b64decode(data + padding)
        
    def create_access_token(data: dict) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        payload = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload.update({"exp": int(expire.timestamp())})
        
        header_b64 = base64_url_encode(json.dumps(header).encode())
        payload_b64 = base64_url_encode(json.dumps(payload).encode())
        
        signing_input = f"{header_b64}.{payload_b64}".encode()
        signature = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
        signature_b64 = base64_url_encode(signature)
        
        return f"{header_b64}.{payload_b64}.{signature_b64}"

    def decode_access_token(token: str) -> dict:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            parts = token.split(".")
            if len(parts) != 3:
                raise credentials_exception
            header_b64, payload_b64, signature_b64 = parts
            
            signing_input = f"{header_b64}.{payload_b64}".encode()
            expected_signature = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
            expected_signature_b64 = base64_url_encode(expected_signature)
            
            if not hmac.compare_digest(signature_b64, expected_signature_b64):
                raise credentials_exception
                
            payload = json.loads(base64_url_decode(payload_b64).decode())
            # Check expiration timestamp
            if payload.get("exp", 0) < datetime.utcnow().timestamp():
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
            return payload
        except Exception:
            raise credentials_exception

# ==========================================================================
# ROLE DEPENDENCY INJECTIONS
# ==========================================================================

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sub claim missing in JWT")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found in system")
    if getattr(user, "status", "active") == "suspended":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended by administrator.")
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
        
    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Required role(s): {', '.join(self.allowed_roles)}"
            )
        return current_user
