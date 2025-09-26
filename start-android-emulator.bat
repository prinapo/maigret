@echo off
setlocal enabledelayedexpansion

REM Ottieni la lista degli emulatori disponibili
set EMULATOR_CMD=emulator -list-avds
for /f "delims=" %%a in ('%EMULATOR_CMD%') do (
    set /a count+=1
    set avd[!count!]=%%a
)

if not defined count (
    echo Nessun emulatore trovato. Assicurati che l'SDK Android sia installato e configurato.
    pause
    exit /b
)

echo Seleziona quale emulatore vuoi avviare:
for /l %%i in (1,1,!count!) do (
    echo   %%i. !avd[%%i]!
)

set /p scelta=Inserisci il numero dell'emulatore da avviare: 
if not defined avd[%scelta%] (
    echo Scelta non valida.
    pause
    exit /b
)

echo Avvio emulatore: !avd[%scelta%]!
emulator -avd !avd[%scelta%]!
