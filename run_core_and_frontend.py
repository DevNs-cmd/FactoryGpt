import subprocess
import sys
import os
import time

root = os.path.dirname(os.path.abspath(__file__))

backend_cwd = os.path.join(root, "apps", "backend-core")
frontend_cwd = os.path.join(root, "apps", "frontend")

print("Starting Backend Core on port 8000...")
backend_proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
    cwd=backend_cwd,
    creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == "nt" else 0
)

print("Starting Frontend on port 3000...")
frontend_proc = subprocess.Popen(
    ["npm.cmd" if os.name == "nt" else "npm", "run", "dev", "--", "-p", "3000"],
    cwd=frontend_cwd,
    creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == "nt" else 0
)

print("\nRunning on localhost:")
print("Frontend: http://localhost:3000")
print("Backend:  http://localhost:8000")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    pass
