@echo off
REM B-Form Tracker API - Development Initialization Script (Windows)

echo.
echo ==========================================
echo B-Form Upload Tracker - Dev Setup
echo ==========================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js v14 or higher.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Confirmed Node.js %NODE_VERSION% found

REM Check npm
echo.
echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo Confirmed npm %NPM_VERSION% found

REM Install dependencies
echo.
echo [3/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Confirmed Dependencies installed

REM Create .env if it doesn't exist
echo.
echo [4/5] Setting up environment variables...
if not exist .env (
    copy .env.example .env
    echo Confirmed Created .env file from template
    echo   Please edit .env with your database credentials
) else (
    echo Confirmed .env file already exists
)

REM Create uploads directory
echo.
echo [5/5] Creating uploads directory...
if not exist uploads mkdir uploads
echo Confirmed Uploads directory ready

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit .env with your database settings
echo 2. Create MySQL database in MySQL command line:
echo    CREATE DATABASE bform_tracker;
echo 3. Start development server:
echo    npm run dev
echo 4. Test the API:
echo    curl http://localhost:5000/health
echo.
pause
