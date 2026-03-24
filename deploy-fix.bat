@echo off
echo ========================================
echo   Deploying Backend Fix
echo ========================================
echo.

echo Step 1: Adding fixed file...
git add src/controllers/employee.controller.js

echo.
echo Step 2: Committing changes...
git commit -m "Fix: Return actual database values for leave balances"

echo.
echo Step 3: Pushing to repository...
git push origin main

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Wait 2-3 minutes for your hosting service to deploy.
echo Then test your app to verify the fix.
echo.
pause
