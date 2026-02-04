@echo off
setlocal

REM Get the XML file path from the first argument
set "xmlFilePath=%~1"

REM Get the directory of the current batch file
set "batchDir=%~dp0"

REM Check if the XML file exists
if not exist "%xmlFilePath%" (
    echo XML file does not exist: %xmlFilePath%
    exit /b 1
)

REM Call the VBScript and pass the XML file path to it
cscript "%batchDir%sendMail.vbs" "%xmlFilePath%"
set errorCode=%ERRORLEVEL%

REM Check the VBScript execution result
if %errorCode% neq 0 (
    echo VBScript execution failed with error code %errorCode%.
    exit /b %errorCode%
)

REM Indicate success
echo XML file processed successfully.

endlocal
exit /b 0
