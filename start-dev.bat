@echo off
echo Starting UD News Development Server...
cd /d "c:\Users\Administrator\Downloads\vscode\udon-orange-news"
start "Server" cmd /k "npm run dev:server"
timeout /t 3 /nobreak >nul
start "Client" cmd /k "cd client && npx vite --host 0.0.0.0 --port 5173"
echo Servers starting...
echo Client: http://localhost:5173
echo Server: http://localhost:3001
pause
