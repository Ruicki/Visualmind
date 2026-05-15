@echo off
echo ==========================================
echo    INICIANDO ENTORNO DE DESARROLLO
echo ==========================================

start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

echo.
echo [!] El Backend correra en el puerto 5000
echo [!] El Frontend correra en el puerto 5173
echo.
echo Se han abierto dos ventanas nuevas. 
echo Si ves errores de 'Network', revisa que el Backend no haya fallado al conectar a la BD.
echo ==========================================
pause
