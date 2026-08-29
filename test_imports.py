import sys
import os

root = os.path.dirname(os.path.abspath(__file__))

services = [
    ("backend-core", os.path.join(root, "apps", "backend-core")),
    ("vision-inspection", os.path.join(root, "services", "vision-inspection")),
    ("chatbot-assistant", os.path.join(root, "services", "chatbot-assistant")),
    ("predictive-maintenance", os.path.join(root, "services", "predictive-maintenance")),
    ("root-cause-analysis", os.path.join(root, "services", "root-cause-analysis")),
]

for name, path in services:
    sys.path.insert(0, path)
    try:
        if name == "backend-core":
            from app.main import app
        elif name == "vision-inspection":
            from app.main import app
        elif name == "chatbot-assistant":
            from app.main import app
        elif name == "predictive-maintenance":
            from app.main import app
        elif name == "root-cause-analysis":
            from app.main import app
        print(f"[{name}] Import SUCCESS")
    except Exception as e:
        print(f"[{name}] Import ERROR: {e}")
    finally:
        if path in sys.path:
            sys.path.remove(path)
