@echo off
echo Starting Stricto AI Brain (Backend)...
start "Stricto Brain" cmd /k "cd backend && python server.py"

echo Starting Frontend...
timeout /t 2 >nul
start http://localhost:8000
python -m http.server 8000
