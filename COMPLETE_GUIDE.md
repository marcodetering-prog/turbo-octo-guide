# 🚀 Complete GitHub & Netlify Deployment Guide

## Prerequisites

Before starting, make sure you have:
- ✅ [Git](https://git-scm.com/downloads) installed
- ✅ [Node.js 18+](https://nodejs.org/) installed
- ✅ A [GitHub](https://github.com) account
- ✅ A [Netlify](https://netlify.com) account (free)

---

## Method 1: Quick Setup (Recommended)

### Step 1: Download and Extract
Download the `netlify-deployment` folder and extract it to your desired location.

### Step 2: Open Terminal/Command Prompt
- **Windows:** Right-click in the folder → "Open in Terminal" or "Git Bash Here"
- **Mac/Linux:** Right-click in the folder → "New Terminal at Folder"

### Step 3: Run the Setup Script

**For Mac/Linux:**
```bash
chmod +x github-setup.sh
./github-setup.sh
```

**For Windows:**
```bash
github-setup.bat
```

Or manually run:
```bash
git init
git add .
git commit -m "Initial commit: Multi-client tenant analytics dashboard"
git branch -M main
```

### Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `tenant-analytics-dashboard` (or your preferred name)
3. Description: "Multi-client tenant inquiry analytics with AI performance tracking"
4. **Important:** Leave "Add a README file" UNCHECKED (we already have one)
5. Click "Create repository"

### Step 5: Push to GitHub

GitHub will show you commands. Copy your repository URL, then run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values.

✅ **Your code is now on GitHub!**

---

## Method 2: Deploy to Netlify

### Option A: Deploy from GitHub (Best - Auto-deploys on updates)

1. **Go to Netlify:**
   - Visit https://app.netlify.com
   - Log in or sign up (free)

2. **Import Project:**
   - Click "Add new site" → "Import an existing project"
   - Click "Deploy with GitHub"
   - Authorize Netlify to access your GitHub

3. **Select Repository:**
   - Find and select your `tenant-analytics-dashboard` repository
   - Click on it

4. **Configure Build Settings:**
   - Netlify will auto-detect settings from `netlify.toml`
   - Build command: `npm run build`
   - Publish directory: `dist`
   - These should be filled automatically

5. **Deploy:**
   - Click "Deploy site"
   - Wait 1-2 minutes for build to complete
   - Your site will be live at `https://random-name.netlify.app`

6. **Custom Domain (Optional):**
   - Click "Domain settings"
   - Click "Add custom domain" or "Change site name"
   - Choose a better name like `your-company-analytics.netlify.app`

✅ **Your dashboard is now live!**

### Option B: Deploy via Drag & Drop (Quick Test)

1. **Build locally:**
   ```bash
   cd netlify-deployment
   npm install
   npm run build
   ```

2. **Deploy:**
   - Go to https://app.netlify.com/drop
   - Drag the `dist` folder
   - Site goes live instantly!

⚠️ Note: Drag & drop doesn't auto-update. Use GitHub method for production.

---

## 🎉 You're Done!

Your analytics dashboard is now:
- ✅ Stored on GitHub (version controlled)
- ✅ Deployed on Netlify (live and accessible)
- ✅ Auto-deploys on every GitHub push (if using Method A)

### Your URLs:
- **GitHub Repo:** `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`
- **Live Site:** `https://your-site.netlify.app`

---

## 📱 How to Use Your Dashboard

1. Visit your live Netlify URL
2. Click "Add Client" to create your first client
3. Upload CSV files with start/end dates
4. View comprehensive analytics
5. Compare multiple periods to track AI performance

---

## 🔄 Making Updates

To update your dashboard:

1. **Edit files locally** in your project folder
2. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. **Netlify auto-deploys** (if using GitHub method)
4. Changes live in 1-2 minutes!

---

## 🆘 Troubleshooting

### "Git command not found"
- Install Git: https://git-scm.com/downloads
- Restart terminal after installation

### "Permission denied (publickey)"
- Set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- Or use HTTPS URL instead: `https://github.com/...`

### Build fails on Netlify
- Check build logs in Netlify dashboard
- Ensure Node.js version is 18+ (set in netlify.toml)
- Try deploying again

### Can't find repository on Netlify
- Make sure repository is public or Netlify has access
- Re-authorize Netlify in GitHub settings
- Try refreshing the repository list

### Site shows blank page
- Check browser console for errors (F12)
- Clear cache and hard reload (Ctrl+Shift+R)
- Check Netlify deploy logs for errors

---

## 💡 Tips

- **Custom Domain:** Add your own domain in Netlify settings
- **Environment Variables:** Add in Netlify UI under "Site settings" → "Environment variables"
- **SSL:** Netlify provides free HTTPS automatically
- **Analytics:** Enable Netlify Analytics for visitor stats
- **Forms:** Netlify can handle form submissions (upgrade plan)

---

## 📊 Next Steps

1. Share the live URL with your team
2. Start uploading CSV data
3. Track AI performance over time
4. Use comparison features to measure improvements

---

## 🔒 Security Notes

- All data is stored in browser localStorage (client-side only)
- No data is sent to any server
- Each user's data is isolated to their browser
- For production with sensitive data, consider adding authentication

---

## 📚 Resources

- **GitHub Docs:** https://docs.github.com
- **Netlify Docs:** https://docs.netlify.com
- **Vite Docs:** https://vitejs.dev
- **React Docs:** https://react.dev

---

## ✨ Success!

You've successfully deployed a production-ready analytics dashboard!

**Share your success:**
- GitHub repo URL: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`
- Live site URL: `https://your-site.netlify.app`

Happy analyzing! 📊
