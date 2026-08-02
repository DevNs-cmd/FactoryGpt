import time
import json
import base64
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

try:
    import jwt
    HAS_JWT = True
except ImportError:
    HAS_JWT = False

security = HTTPBearer(auto_error=False)

VALID_ROLES = {
    "Super Admin",
    "Plant Head",
    "Production Manager",
    "QA Manager",
    "Maintenance Manager",
    "Operator",
    "Engineer"
}

def create_access_token(user_id: str, role: str = "Engineer", department: str = "Production", expires_in: int = 86400) -> str:
    if role not in VALID_ROLES:
        role = "Engineer"
    payload = {
        "sub": user_id,
        "role": role,
        "department": department,
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time())
    }
    if HAS_JWT:
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    else:
        # Fallback base64 token format
        raw = json.dumps(payload).encode("utf-[8]")
        return base64.b64encode(raw).decode("utf-8")

def decode_token(token: str) -> Dict[str, Any]:
    if HAS_JWT:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        try:
            raw = base64.b64decode(token.encode("utf-8"))
            return json.loads(raw.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token format")

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    if not credentials:
        return {
            "sub": "anonymous",
            "role": "Production Manager",
            "department": "Production Operations"
        }
    return decode_token(credentials.credentials)
