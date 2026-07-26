"""
Owner: Vedant (STRETCH — only if core Root Cause Analysis is done early)
Minimal in-memory stock tracker + rule-based reorder trigger. Deliberately
simple: no real RFID/barcode hardware exists, so this just proves the
concept.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/inventory", tags=["inventory"])

# in-memory for the demo — swap for a real table only if you have time left
_stock = {
    "steel-sheet-2mm": {"quantity": 120, "reorder_threshold": 50},
    "bolt-m8": {"quantity": 40, "reorder_threshold": 100},
    "paint-primer-5l": {"quantity": 15, "reorder_threshold": 10},
}


class StockUpdate(BaseModel):
    item: str
    quantity_used: int


@router.get("")
def get_stock():
    return [
        {"item": item, **info, "needs_reorder": info["quantity"] < info["reorder_threshold"]}
        for item, info in _stock.items()
    ]


@router.post("/use")
def use_stock(update: StockUpdate):
    if update.item not in _stock:
        return {"error": "unknown item"}
    _stock[update.item]["quantity"] -= update.quantity_used
    needs_reorder = _stock[update.item]["quantity"] < _stock[update.item]["reorder_threshold"]
    return {"item": update.item, "remaining": _stock[update.item]["quantity"], "needs_reorder": needs_reorder}
