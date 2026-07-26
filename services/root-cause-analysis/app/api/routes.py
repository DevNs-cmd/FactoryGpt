"""Owner: Vedant."""
from fastapi import APIRouter
from app.analytics.queries import root_cause_breakdown
from app.analytics.report import generate_report

router = APIRouter()


@router.get("/root-cause")
def root_cause():
    return root_cause_breakdown()


@router.get("/report")
def report():
    return generate_report()
