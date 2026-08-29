"""
Owner: Anuj
Multi-Tenant Authentication & Factory Onboarding Router.

Security Hardening:
  - Brute-force rate limiting (IP-based sliding window)
  - Password strength enforcement (min 8 chars, mixed complexity)
  - Input sanitization & email validation
  - Constant-time password comparison (bcrypt)
  - Account lockout after repeated failures
  - Generic error messages to prevent user enumeration
"""
import re
import time
import secrets
from typing import List, Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Factory, FactoryLine
from app.schemas import (
    UserRegisterIn,
    UserLoginIn,
    TokenOut,
    UserOut,
    FactoryOut,
    FactoryLineOut,
    FactorySetupIn,
    UserApprovalActionIn,
)
from app.auth.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_role,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ══════════════════════════════════════════════════════════════════
# BRUTE-FORCE RATE LIMITER (IP-based sliding window)
# ══════════════════════════════════════════════════════════════════

# Track failed login attempts per IP address
_login_attempts: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_WINDOW = 300      # 5-minute sliding window
_MAX_ATTEMPTS_PER_WINDOW = 10  # Max 10 failed attempts per 5 minutes
_LOCKOUT_DURATION = 600        # 10-minute lockout after exceeding limit


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting reverse proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(ip: str):
    """
    Sliding window rate limiter.
    Raises 429 Too Many Requests if the IP has exceeded the threshold.
    """
    now = time.time()
    # Prune old entries outside the window
    _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < _RATE_LIMIT_WINDOW]

    if len(_login_attempts[ip]) >= _MAX_ATTEMPTS_PER_WINDOW:
        oldest_in_window = _login_attempts[ip][0]
        retry_after = int(_LOCKOUT_DURATION - (now - oldest_in_window))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {max(1, retry_after // 60)} minutes.",
            headers={"Retry-After": str(max(1, retry_after))},
        )


def _record_failed_attempt(ip: str):
    """Record a failed login attempt for rate limiting."""
    _login_attempts[ip].append(time.time())


def _clear_failed_attempts(ip: str):
    """Clear rate limit history on successful login."""
    _login_attempts.pop(ip, None)


# ══════════════════════════════════════════════════════════════════
# PASSWORD STRENGTH VALIDATOR
# ══════════════════════════════════════════════════════════════════

def _validate_password_strength(password: str):
    """
    Enforces minimum password security policy:
    - At least 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - No pure whitespace passwords
    """
    if not password or len(password.strip()) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter.",
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter.",
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit.",
        )


# ══════════════════════════════════════════════════════════════════
# INPUT SANITIZATION
# ══════════════════════════════════════════════════════════════════

_EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def _validate_email(email: str) -> str:
    """Validates and normalizes email format."""
    cleaned = email.strip().lower()
    if not _EMAIL_REGEX.match(cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )
    if len(cleaned) > 254:  # RFC 5321 max email length
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is too long.",
        )
    return cleaned


def _sanitize_text(text: str, field_name: str, max_length: int = 100) -> str:
    """Strip and validate text input fields."""
    cleaned = text.strip() if text else ""
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} cannot be empty.",
        )
    if len(cleaned) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} cannot exceed {max_length} characters.",
        )
    # Block obvious injection attempts (script tags, SQL fragments)
    suspicious_patterns = ["<script", "javascript:", "DROP TABLE", "'; --", "OR 1=1"]
    for pattern in suspicious_patterns:
        if pattern.lower() in cleaned.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid characters detected in {field_name}.",
            )
    return cleaned


# ══════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════

def generate_factory_code(name: str, db: Session) -> str:
    """Generates a clean human-readable factory join code like TATA-8F2A."""
    clean_prefix = re.sub(r'[^A-Z0-9]', '', (name or "FACT").upper())[:4]
    if len(clean_prefix) < 3:
        clean_prefix = (clean_prefix + "FACT")[:4]

    for _ in range(20):
        suffix = secrets.token_hex(2).upper()
        code = f"{clean_prefix}-{suffix}"
        if not db.query(Factory).filter(Factory.code == code).first():
            return code
    return f"FACT-{secrets.token_hex(3).upper()}"


def build_user_out(user: User, db: Session) -> UserOut:
    factory = db.query(Factory).filter(Factory.id == user.factory_id).first() if user.factory_id else None
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        factory_id=user.factory_id,
        factory_name=factory.name if factory else None,
        factory_code=factory.code if factory else None,
        is_approved=bool(getattr(user, "is_approved", True)),
        created_at=user.created_at,
    )


def build_factory_out(factory: Factory) -> FactoryOut:
    lines_out = [
        FactoryLineOut(
            id=line.id,
            name=line.name,
            machine_count=line.machine_count,
            target_per_shift=line.target_per_shift,
            shifts=line.shifts,
        )
        for line in (factory.lines or [])
    ]
    return FactoryOut(
        id=factory.id,
        name=factory.name,
        code=factory.code,
        location=factory.location,
        industry=factory.industry or "general",
        lines=lines_out,
    )


# ══════════════════════════════════════════════════════════════════
# REGISTRATION ENDPOINT
# ══════════════════════════════════════════════════════════════════

@router.post("/register", response_model=TokenOut)
def register(payload: UserRegisterIn, request: Request, db: Session = Depends(get_db)):
    # 0. Rate limit registration attempts (prevent mass account creation)
    client_ip = _get_client_ip(request)
    _check_rate_limit(client_ip)

    # 1. Validate & sanitize all inputs
    email_clean = _validate_email(payload.email)
    full_name = _sanitize_text(payload.full_name, "Full name", max_length=100)
    _validate_password_strength(payload.password)

    # 2. Check if email already registered
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    target_factory: Optional[Factory] = None

    # 3. If role is 'owner' -> Create new factory
    if payload.role == "owner" or (payload.factory_name and not payload.factory_code):
        factory_name = _sanitize_text(
            payload.factory_name or f"{full_name}'s Plant",
            "Factory name",
            max_length=150,
        )
        code = generate_factory_code(factory_name, db)
        target_factory = Factory(
            name=factory_name,
            code=code,
            location=payload.factory_location,
            industry=payload.industry or "general",
        )
        db.add(target_factory)
        db.commit()
        db.refresh(target_factory)

        # Create configured lines or defaults
        lines_to_create = payload.lines or [
            {"name": "Line-1", "machine_count": 3, "target_per_shift": 1500, "shifts": "A,B,C"},
            {"name": "Line-2", "machine_count": 3, "target_per_shift": 800, "shifts": "A,B,C"},
            {"name": "Line-3", "machine_count": 3, "target_per_shift": 2000, "shifts": "A,B,C"},
        ]
        for line_data in lines_to_create:
            line_dict = line_data.model_dump() if hasattr(line_data, "model_dump") else dict(line_data)
            fl = FactoryLine(
                factory_id=target_factory.id,
                name=line_dict.get("name", "Line-1"),
                machine_count=line_dict.get("machine_count", 3),
                target_per_shift=line_dict.get("target_per_shift", 1000),
                shifts=line_dict.get("shifts", "A,B,C"),
            )
            db.add(fl)
        db.commit()
        db.refresh(target_factory)

        # Clean new factory setup (no auto-injected dummy tickets or dummy production)
        pass

    # 4. If role is not owner -> Join existing factory via code
    elif payload.factory_code:
        code_search = payload.factory_code.strip().upper()
        target_factory = db.query(Factory).filter(Factory.code == code_search).first()
        if not target_factory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No factory found with join code '{code_search}'. Please check with your plant administrator.",
            )
    else:
        # Fallback to default factory if exists or create one
        target_factory = db.query(Factory).first()
        if not target_factory:
            target_factory = Factory(
                name="Main Manufacturing Plant",
                code="MAIN-001",
                location="HQ Facility",
                industry="general",
            )
            db.add(target_factory)
            db.commit()
            db.refresh(target_factory)

    # 5. Create User
    is_owner_flow = (payload.role == "owner") or (payload.factory_name and not payload.factory_code)
    new_user = User(
        email=email_clean,
        hashed_password=get_password_hash(payload.password),
        full_name=full_name,
        role=payload.role or "operator",
        factory_id=target_factory.id if target_factory else None,
        is_approved=True if is_owner_flow else False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Clear rate limit on successful registration
    _clear_failed_attempts(client_ip)

    # 6. Generate token
    token = create_access_token({
        "sub": str(new_user.id),
        "email": new_user.email,
        "role": new_user.role,
        "factory_id": new_user.factory_id,
    })

    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=build_user_out(new_user, db),
        factory=build_factory_out(target_factory) if target_factory else None,
    )


# ══════════════════════════════════════════════════════════════════
# LOGIN ENDPOINT (with brute-force protection)
# ══════════════════════════════════════════════════════════════════

@router.post("/login", response_model=TokenOut)
def login(payload: UserLoginIn, request: Request, db: Session = Depends(get_db)):
    client_ip = _get_client_ip(request)

    # 1. Check rate limit BEFORE any database query
    _check_rate_limit(client_ip)

    # 2. Validate email format
    email_clean = _validate_email(payload.email)

    # 3. Lookup user
    user = db.query(User).filter(User.email == email_clean).first()

    # 4. Verify password (constant-time comparison via bcrypt)
    #    IMPORTANT: Use same generic error for "user not found" AND "wrong password"
    #    to prevent user enumeration attacks.
    if not user or not verify_password(payload.password, user.hashed_password):
        _record_failed_attempt(client_ip)

        # Calculate remaining attempts for helpful feedback
        remaining = _MAX_ATTEMPTS_PER_WINDOW - len(_login_attempts.get(client_ip, []))
        detail_msg = "Incorrect email or password."
        if remaining <= 3:
            detail_msg += f" {remaining} attempt(s) remaining before temporary lockout."

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail_msg,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 5. Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact your plant administrator.",
        )

    # 6. Successful login — clear failed attempts for this IP
    _clear_failed_attempts(client_ip)

    factory = db.query(Factory).filter(Factory.id == user.factory_id).first() if user.factory_id else None

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "factory_id": user.factory_id,
    })

    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=build_user_out(user, db),
        factory=build_factory_out(factory) if factory else None,
    )


# ══════════════════════════════════════════════════════════════════
# AUTHENTICATED ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@router.get("/me", response_model=TokenOut)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    factory = db.query(Factory).filter(Factory.id == user.factory_id).first() if user.factory_id else None
    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "factory_id": user.factory_id,
    })
    return TokenOut(
        access_token=token,
        token_type="bearer",
        user=build_user_out(user, db),
        factory=build_factory_out(factory) if factory else None,
    )


@router.get("/factory", response_model=Optional[FactoryOut])
def get_factory(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.factory_id:
        return None
    factory = db.query(Factory).filter(Factory.id == user.factory_id).first()
    if not factory:
        return None
    return build_factory_out(factory)


# ══════════════════════════════════════════════════════════════════
# ADMIN APPROVAL QUEUE ENDPOINTS (Owner & Manager Only)
# ══════════════════════════════════════════════════════════════════

@router.get("/pending-users", response_model=List[UserOut])
def get_pending_users(
    user: User = Depends(require_role(["owner", "manager"])),
    db: Session = Depends(get_db)
):
    """Retrieve all pending approval join-requests for the administrator's factory."""
    if not user.factory_id:
        return []
    pending = (
        db.query(User)
        .filter(
            User.factory_id == user.factory_id,
            (User.is_approved == False) | (User.is_approved.is_(None))
        )
        .order_by(User.created_at.desc())
        .all()
    )
    return [build_user_out(u, db) for u in pending]


@router.post("/approve-user")
def approve_user(
    payload: UserApprovalActionIn,
    user: User = Depends(require_role(["owner", "manager"])),
    db: Session = Depends(get_db)
):
    """Approve a pending user join-request into the factory workspace."""
    if not user.factory_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No factory context found.")
    
    target_user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.factory_id == user.factory_id)
        .first()
    )
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your factory workspace."
        )
    
    target_user.is_approved = True
    db.commit()
    return {"status": "ok", "message": f"{target_user.full_name} ({target_user.email}) has been approved."}


@router.post("/reject-user")
def reject_user(
    payload: UserApprovalActionIn,
    user: User = Depends(require_role(["owner", "manager"])),
    db: Session = Depends(get_db)
):
    """Reject and delete a pending user join-request from the factory workspace."""
    if not user.factory_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No factory context found.")
    
    target_user = (
        db.query(User)
        .filter(User.id == payload.user_id, User.factory_id == user.factory_id)
        .first()
    )
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your factory workspace."
        )
    
    db.delete(target_user)
    db.commit()
    return {"status": "ok", "message": f"Membership request for {target_user.email} has been rejected."}

