# Multi-Client Tenant Analytics Dashboard

A comprehensive analytics dashboard for tracking tenant-AI interactions across multiple clients with AI performance KPIs and period comparisons.

## Features

- 📊 **Multi-Client Management** - Add and manage multiple clients
- 📅 **Period-Based Tracking** - Upload CSV data for specific time periods
- 💾 **Persistent Storage** - All data saved automatically using browser storage
- 🎯 **13 AI Performance KPIs** - Track efficiency, success, satisfaction, and accuracy
- 🔄 **Period Comparison** - Compare performance across multiple time frames
- ✅ **Data Validation** - Automatic quality checks and issue reporting

## AI Performance KPIs Tracked

### Efficiency Metrics (Lower is Better)
- Average Response Time
- Average Resolution Time
- Average Conversation Length

### Success Metrics (Higher is Better)
- Report Success Rate
- First Contact Resolution
- Data Quality Score

### User Satisfaction Metrics
- Satisfaction Rate
- Frustration Rate
- Escalation Rate

### Classification Accuracy (Higher is Better)
- Deficiency Type Accuracy
- Cost Estimate Coverage

### Operational Metrics
- After-Hours Inquiries
- Long Conversation Rate

## Deployment to Netlify

### Option 1: Deploy from GitHub (Recommended)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and select your repository
   - Netlify will auto-detect settings from `netlify.toml`
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize and deploy:**
   ```bash
   netlify init
   netlify deploy --prod
   ```

### Option 3: Manual Deploy (Drag & Drop)

1. **Build the project locally:**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag and drop the `dist` folder
   - Your site will be live immediately

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   ```

## CSV File Format

Your CSV file should contain the following columns:
- `Content` - Message text
- `MessageType` - Type identifier (1=AI, 3=Tenant, 5=Tool)
- `TimeSent` - Timestamp (format: YYYY-MM-DD HH:MM:SS.mmmmmmm)
- `ConversationId` - Unique conversation identifier

## Storage Note

This application uses browser localStorage to persist data. Data is stored locally in the user's browser and is not sent to any server. Each user's data is isolated to their browser session.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **PapaParse** - CSV parsing

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with localStorage support

## Support

For issues or questions, please open an issue in the GitHub repository.

## License

MIT
