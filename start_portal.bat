@echo off
echo Starting FactoryGPT Microservices and Frontend on Localhost...

start "Backend Core (Port 8000)" /D "%~dp0apps\backend-core" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
start "Vision Inspection (Port 8001)" /D "%~dp0services\vision-inspection" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"
start "Chatbot Assistant (Port 8002)" /D "%~dp0services\chatbot-assistant" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8002"
start "Predictive Maintenance (Port 8003)" /D "%~dp0services\predictive-maintenance" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8003"
start "Root Cause Analysis (Port 8004)" /D "%~dp0services\root-cause-analysis" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8004"
start "Frontend Dashboard (Port 3000)" /D "%~dp0apps\frontend" cmd /k "npm run dev -- -p 3000"

echo.
echo All microservices and frontend launched!
echo Access the Frontend at: http://localhost:3000
echo Access API Docs at:     http://localhost:8000/docs
