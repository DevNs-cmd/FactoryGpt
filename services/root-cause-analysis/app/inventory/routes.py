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
_history = []

class StockUpdate(BaseModel):
    item: str
    quantity_used: int
class RestockRequest(BaseModel):
    item: str
    quantity_added: int

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

    # Save this transaction in history
    _history.append({
        "item": update.item,
        "quantity": update.quantity_used,
        "action": "used"
    })

    needs_reorder = (
        _stock[update.item]["quantity"]
        < _stock[update.item]["reorder_threshold"]
    )

    return {
        "item": update.item,
        "remaining": _stock[update.item]["quantity"],
        "needs_reorder": needs_reorder,
    }
@router.get("/history")
def inventory_history():
    return _history
@router.get("/summary")
def inventory_summary():
    total_items = len(_stock)

    items_to_reorder = sum(
        1
        for item in _stock.values()
        if item["quantity"] < item["reorder_threshold"]
    )

    healthy_items = total_items - items_to_reorder

    return {
        "total_items": total_items,
        "items_to_reorder": items_to_reorder,
        "healthy_items": healthy_items,
    }
@router.get("/low-stock")
def low_stock():
    return [
        {
            "item": item,
            **info,
            "needs_reorder": True,
        }
        for item, info in _stock.items()
        if info["quantity"] < info["reorder_threshold"]
    ]
@router.post("/restock")
def restock_stock(update: RestockRequest):
    if update.item not in _stock:
        return {"error": "unknown item"}

    _stock[update.item]["quantity"] += update.quantity_added

    _history.append({
        "item": update.item,
        "quantity": update.quantity_added,
        "action": "restocked"
    })

    needs_reorder = (
        _stock[update.item]["quantity"]
        < _stock[update.item]["reorder_threshold"]
    )

    return {
        "item": update.item,
        "new_quantity": _stock[update.item]["quantity"],
        "needs_reorder": needs_reorder,
    }