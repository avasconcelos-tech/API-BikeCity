@echo off
setlocal

echo ===============================================
echo BikeCity - liberar porta 3000 no Firewall
echo ===============================================
echo.
echo Este arquivo precisa ser executado como ADMINISTRADOR.
echo.

netsh advfirewall firewall add rule name="BikeCity Node 3000" dir=in action=allow protocol=TCP localport=3000 profile=private

if %errorlevel%==0 (
  echo.
  echo Porta 3000 liberada no perfil de rede privada.
) else (
  echo.
  echo Nao foi possivel alterar o Firewall.
  echo Clique com o botao direito neste arquivo e escolha "Executar como administrador".
)

echo.
pause
