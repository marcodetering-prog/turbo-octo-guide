@echo off
REM GitHub Deployment Script for Tenant Analytics Dashboard (Windows)

echo.
echo 🚀 Tenant Analytics Dashboard - GitHub Setup
echo ==============================================
echo.

REM Step 1: Initialize Git
echo 📦 Step 1: Initializing Git repository...
git init
echo ✅ Git initialized
echo.

REM Step 2: Add all files
echo 📁 Step 2: Adding all files to Git...
git add .
echo ✅ Files added
echo.

REM Step 3: Create initial commit
echo 💾 Step 3: Creating initial commit...
git commit -m "Initial commit: Multi-client tenant analytics dashboard with AI performance tracking"
echo ✅ Commit created
echo.

REM Step 4: Rename branch to main
echo 🔄 Step 4: Setting main branch...
git branch -M main
echo ✅ Branch set to main
echo.

REM Step 5: Instructions
echo 🔗 Step 5: Add your GitHub repository
echo.
echo Please do ONE of the following:
echo.
echo Option A: If you already created a GitHub repository:
echo   1. Copy your repository URL (e.g., https://github.com/username/repo-name.git)
echo   2. Run: git remote add origin YOUR_REPO_URL
echo   3. Run: git push -u origin main
echo.
echo Option B: Create a new repository on GitHub:
echo   1. Go to https://github.com/new
echo   2. Name it (e.g., 'tenant-analytics-dashboard')
echo   3. Don't initialize with README (we already have one)
echo   4. Create the repository
echo   5. Copy the repository URL
echo   6. Run: git remote add origin YOUR_REPO_URL
echo   7. Run: git push -u origin main
echo.
echo ✨ After pushing, your code will be on GitHub!
echo.
echo 📱 Next: Deploy to Netlify
echo   - Go to https://app.netlify.com
echo   - Click 'Add new site' → 'Import an existing project'
echo   - Choose GitHub and select your repository
echo   - Click 'Deploy site'
echo   - Done! 🎉
echo.
pause
