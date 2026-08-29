import subprocess
import sys
import os
import time
import urllib.request

root = os.path.dirname(os.path.abspath(__file__))

services = [
    {
        "name": "backend-core",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        "cwd": os.path.join(root, "apps", "backend-core"),
        "health": "http://localhost:8000/health"
    },
    {
        "name": "vision-inspection",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"],
        "cwd": os.path.join(root, "services", "vision-inspection"),
        "health": "http://localhost:8001/health"
    },
    {
        "name": "chatbot-assistant",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"],
        "cwd": os.path.join(root, "services", "chatbot-assistant"),
        "health": "http://localhost:8002/health"
    },
    {
        "name": "predictive-maintenance",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"],
        "cwd": os.path.join(root, "services", "predictive-maintenance"),
        "health": "http://localhost:8003/health"
    },
    {
        "name": "root-cause-analysis",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004", "--reload"],
        "cwd": os.path.join(root, "services", "root-cause-analysis"),
        "health": "http://localhost:8004/health"
    },
    {
        "name": "frontend",
        "cmd": ["npm.cmd" if os.name == "nt" else "npm", "run", "dev", "--", "-p", "3000"],
        "cwd": os.path.join(root, "apps", "frontend"),
        "health": "http://localhost:3000"
    }
]

processes = []

print("=== Starting FactoryGPT Microservices and Frontend ===")

for service in services:
    print(f"Launching {service['name']}...")
    try:
        proc = subprocess.Popen(
            service["cmd"],
            cwd=service["cwd"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == "nt" else 0
        )
        processes.append((service, proc))
        print(f"-> Started {service['name']} (PID {proc.pid})")
    except Exception as e:
        print(f"-> Failed to start {service['name']}: {e}")

print("\nWaiting 5 seconds for services to initialize...")
time.sleep(5)

print("\n=== Health Checks ===")
for service, proc in processes:
    try:
        req = urllib.request.urlopen(service["health"], timeout=3)
        status = req.getcode()
        print(f"[ONLINE] {service['name']} ({service['health']}) - Status {status}")
    except Exception as e:
        print(f"[STARTING/CHECKING] {service['name']} ({service['health']})")

print("\nPortal is now running on localhost!")
print("Frontend Dashboard: http://localhost:3000")
print("Backend Core API:   http://localhost:8000/docs")

# Keep parent alive so sub-processes remain running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nStopping services...")
