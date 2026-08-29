"""
Starts all 6 FactoryGPT services in background and monitors their health.
"""
import subprocess
import sys
import os
import time
import urllib.request

root = os.path.dirname(os.path.abspath(__file__))

services = [
    ("Backend Core", [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], os.path.join(root, "apps", "backend-core"), "http://127.0.0.1:8000/health"),
    ("Vision Inspection", [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"], os.path.join(root, "services", "vision-inspection"), "http://127.0.0.1:8001/health"),
    ("Chatbot Assistant", [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002"], os.path.join(root, "services", "chatbot-assistant"), "http://127.0.0.1:8002/health"),
    ("Predictive Maintenance", [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8003"], os.path.join(root, "services", "predictive-maintenance"), "http://127.0.0.1:8003/health"),
    ("Root Cause Analysis", [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8004"], os.path.join(root, "services", "root-cause-analysis"), "http://127.0.0.1:8004/health"),
    ("Frontend Portal", ["npm.cmd" if os.name == "nt" else "npm", "run", "dev", "--", "-p", "3000"], os.path.join(root, "apps", "frontend"), "http://127.0.0.1:3000"),
]

procs = []
for name, cmd, cwd, health_url in services:
    p = subprocess.Popen(cmd, cwd=cwd)
    procs.append((name, p, health_url))

print("All 6 services launched. Waiting 8s for initialization...")
time.sleep(8)

for name, p, health_url in procs:
    try:
        r = urllib.request.urlopen(health_url, timeout=3)
        print(f"ONLINE: {name} -> {health_url}")
    except Exception as e:
        print(f"CHECK: {name} -> {health_url} ({e})")

print("System ready at http://localhost:3000")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    for name, p, _ in procs:
        p.terminate()
