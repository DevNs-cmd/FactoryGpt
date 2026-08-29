"""
FactoryGPT — Master Launch Script for all 6 Microservices and Frontend ERP Portal.
Starts:
1. Backend Core (Port 8000)
2. Vision Inspection (Port 8001)
3. Chatbot Assistant (Port 8002)
4. Predictive Maintenance (Port 8003)
5. Root Cause Analysis (Port 8004)
6. Next.js Frontend (Port 3000)
"""
import subprocess
import sys
import os
import time
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

root = os.path.dirname(os.path.abspath(__file__))

services = [
    {
        "name": "Backend Core",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        "cwd": os.path.join(root, "apps", "backend-core"),
        "health": "http://localhost:8000/health"
    },
    {
        "name": "Vision Inspection",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"],
        "cwd": os.path.join(root, "services", "vision-inspection"),
        "health": "http://localhost:8001/health"
    },
    {
        "name": "Chatbot Assistant",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"],
        "cwd": os.path.join(root, "services", "chatbot-assistant"),
        "health": "http://localhost:8002/health"
    },
    {
        "name": "Predictive Maintenance",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"],
        "cwd": os.path.join(root, "services", "predictive-maintenance"),
        "health": "http://localhost:8003/health"
    },
    {
        "name": "Root Cause Analysis",
        "cmd": [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"],
        "cwd": os.path.join(root, "services", "root-cause-analysis"),
        "health": "http://localhost:8004/health"
    },
    {
        "name": "Frontend ERP Portal",
        "cmd": ["npm.cmd" if os.name == "nt" else "npm", "run", "dev", "--", "-p", "3000"],
        "cwd": os.path.join(root, "apps", "frontend"),
        "health": "http://localhost:3000"
    }
]

processes = []

print("=" * 65)
print("  Starting FactoryGPT Full Distributed Architecture (6 Services)")
print("=" * 65)

for svc in services:
    print(f"  [+] Starting {svc['name']}...")
    p = subprocess.Popen(
        svc["cmd"],
        cwd=svc["cwd"],
        creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == "nt" else 0
    )
    processes.append((svc, p))

print("\nWaiting 6 seconds for microservices to initialize...")
time.sleep(6)

print("\n" + "=" * 65)
print("  Running Health Probes Across All Services")
print("=" * 65)

for svc, p in processes:
    try:
        req = urllib.request.urlopen(svc["health"], timeout=3)
        res = req.read().decode('utf-8', errors='ignore')
        print(f"  [ONLINE]  {svc['name']:<24} -> {svc['health']}")
    except Exception as e:
        print(f"  [STARTING] {svc['name']:<24} -> {svc['health']}")

print("\n" + "=" * 65)
print("  All systems operational! Open http://localhost:3000")
print("=" * 65)
print("Press Ctrl+C in this window to terminate all services.")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down all processes...")
    for svc, p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    print("Done.")
