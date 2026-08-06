"""
Owner: Vedant
Fake DowntimeEvent data for local dev, used when backend-core isn't
running. Shape matches docs/api-contracts.md's DowntimeEvent, plus
'shift' and 'operator_id' (the proposed fields for the shift/operator
breakdown — not yet in backend-core's real schema).
"""

MOCK_DOWNTIME_EVENTS = [
    {"line_id": "L1", "machine_id": "M01", "duration_seconds": 600, "reason": "jam", "shift": "A", "operator_id": "op_12", "timestamp": "2026-07-29T08:00:00Z"},
    {"line_id": "L1", "machine_id": "M01", "duration_seconds": 3000, "reason": "jam", "shift": "A", "operator_id": "op_12", "timestamp": "2026-07-29T09:00:00Z"},
    {"line_id": "L2", "machine_id": "M02", "duration_seconds": 900, "reason": "changeover", "shift": "B", "operator_id": "op_07", "timestamp": "2026-07-29T14:00:00Z"},
    {"line_id": "L1", "machine_id": "M03", "duration_seconds": 1200, "reason": "breakdown", "shift": "C", "operator_id": "op_19", "timestamp": "2026-07-29T22:00:00Z"},
    {"line_id": "L2", "machine_id": "M02", "duration_seconds": 450, "reason": "jam", "shift": "B", "operator_id": "op_07", "timestamp": "2026-07-29T15:00:00Z"},
    {
    "line_id": "L2",
    "machine_id": "M04",
    "duration_seconds": 5000,
    "reason": "sensor_failure",
    "shift": "A",
    "operator_id": "op_21",
    "timestamp": "2026-07-29T16:30:00Z"
}
]
