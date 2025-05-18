@echo off
echo.
echo ===== Verificando Modularização do Magic SDK =====
echo.

echo 1. Verificando se o arquivo magic-sdk.js existe...
if exist magic-sdk.js (
  echo Arquivo magic-sdk.js encontrado. [OK]
) else (
  echo ERRO: Arquivo magic-sdk.js não encontrado!
  goto :error
)

echo.
echo 2. Verificando referência no index.html...
findstr /c:"magic-sdk.js" index.html > nul
if %errorlevel% equ 0 (
  echo Arquivo corretamente referenciado no index.html. [OK]
) else (
  echo ERRO: Referência ao magic-sdk.js não encontrada no index.html!
  goto :error
)

echo.
echo 3. Verificando atualizações no script.js...
findstr /c:"window.magicSDK" script.js > nul
if %errorlevel% equ 0 (
  echo Script.js atualizado para usar o módulo. [OK]
) else (
  echo ERRO: Script.js não parece estar usando o módulo!
  goto :error
)

echo.
echo 4. Verificando a página de teste...
if exist tests\magic-sdk-module-page.html (
  echo Página de teste encontrada. [OK]
) else (
  echo ERRO: Página de teste não encontrada!
  goto :error
)

echo.
echo ===== Verificação concluída com sucesso! =====
echo O Magic SDK foi modularizado corretamente.
echo.
echo Para testar, abra o arquivo index.html no navegador
echo ou execute o arquivo tests/magic-sdk-module-page.html para testes isolados.
echo.
goto :end

:error
echo.
echo ===== ERRO NA VERIFICAÇÃO =====
echo Alguns problemas foram encontrados na modularização.
echo Por favor, revise os passos e conserte os problemas.
echo.

:end
