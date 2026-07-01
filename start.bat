@echo off
REM Gardrop — backend (.NET :3001) + frontend (Vite :5173) isa salir.
REM Her biri ayri pencerede. Postgres (localhost:5432) evvelceden islemelidir.

setlocal
set ROOT=%~dp0

echo ============================================
echo  Gardrop start — backend + frontend
echo ============================================

REM --- Frontend ilk qurulum: npm install ---
if not exist "%ROOT%frontend\node_modules" (
  echo [setup] npm install ^(ilk defe, bir az cekir^)...
  pushd "%ROOT%frontend"
  call npm install
  popd
)

REM --- Backend :3001 (ayri pencere) ---
echo [start] Backend :3001 ...
start "Gardrop API :3001" cmd /k "cd /d "%ROOT%backend-csharp\Presentation" && dotnet run"

REM --- Frontend :5173 (ayri pencere) ---
echo [start] Frontend :5173 ...
start "Gardrop Frontend :5173" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo ^(Bagli olan pencereni baglamaqla dayandirilir^)
endlocal
