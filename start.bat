@echo off
echo.
echo  NULL.OS — Building frontend...
echo.
cd /d "%~dp0frontend"
call npm run build
cd /d "%~dp0"
echo.
echo  NULL.OS — Starting backend server...
echo  Open http://127.0.0.1:8000
echo.
py -3.11 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
