@echo off
echo Starting Backend Core (port 8000) and Frontend (port 3000)...

start "Backend Core (Port 8000)" /D "%~dp0apps\backend-core" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
start "Frontend (Port 3000)" /D "%~dp0apps\frontend" cmd /k "npm run dev -- -p 3000"

echo.
echo Started successfully!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
