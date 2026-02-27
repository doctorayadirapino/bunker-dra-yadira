@echo off
echo ============================================================
echo   BUNKER DOCTORA YADIRA PINO - ASISTENTE DE SUBIDA V23.2
echo ============================================================
echo.
echo 1. Preparando conexion con GitHub...
git remote set-url origin https://github.com/doctorayadirapino/bunker-dra-yadira.git
echo.
echo 2. Subiendo cambios (8 Categorias de Consulta)...
echo.
echo   ATENCION: Se abrira una ventana en su navegador. 
echo   Por favor haga clic en "Authorize" o "Sign In".
echo.
git push -u origin main
echo.
if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema con la subida. Verifique su conexion.
) else (
    echo [EXITO] El codigo ya esta en el Bunker Digital de GitHub!
)
echo.
pause
