@echo off
setlocal
cd /d "%~dp0"

echo ===============================================
echo BikeCity - servidor para rede local
echo ===============================================
echo.
echo Instale as dependencias caso ainda nao tenha feito:
echo    npm install
echo.
echo Iniciando servidor na porta 3000...
echo.
npm start
pause
