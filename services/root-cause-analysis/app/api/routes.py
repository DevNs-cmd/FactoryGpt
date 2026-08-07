"""Owner: Vedant."""
from fastapi import APIRouter
from app.analytics.queries import (
    root_cause_breakdown,
    shift_operator_breakdown,
    dashboard_summary,
)
from app.analytics.report import generate_report

router = APIRouter()


@router.get("/root-cause")
def root_cause():
    return root_cause_breakdown()

@router.get("/root-cause/by-shift-operator")
def root_cause_by_shift_operator():
    return shift_operator_breakdown()

@router.get("/report")
def report():
    return generate_report()
@router.get("/dashboard")
def dashboard():
    return dashboard_summary()