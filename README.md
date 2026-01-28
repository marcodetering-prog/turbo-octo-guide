# Multi-Client Tenant Analytics Dashboard

A comprehensive, feature-rich analytics dashboard for tracking tenant-AI interactions across multiple clients with AI performance KPIs, period comparisons, trend analysis, and advanced AI integration.

**Status:** Production-ready | **Build:** ✓ Passing | **Deploy:** Netlify, Railway, Docker

---

## 📋 Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Feature Flags](#feature-flags)
5. [CSV Format](#csv-format)
6. [Deployment](#deployment)
7. [Development](#development)
8. [Tech Stack](#tech-stack)

---

## ✨ Features

### Core Features
- 📊 **Multi-Client Management** - Add and manage multiple clients with isolated data
- 📅 **Automatic Period Detection** - CSV uploads auto-detect and group data by calendar months
- 📈 **40+ KPI Dashboard** - Comprehensive metrics across efficiency, success, satisfaction, and accuracy
- 🎯 **Trend Analysis** - Compare multiple periods with MoM % change, growth rates, and rankings
- 🤖 **AI Integration** - OpenAI & Claude API support for enhanced KPI analysis
- 🔄 **CSV Auto-Chunking** - Large files (>7 days) automatically split into 7-day chunks with AI analysis
- 📊 **Interactive Charts** - Pie, bar, and line charts using Recharts
- 💾 **Persistent Storage** - All data saved to browser localStorage
- ✅ **Data Validation** - Automatic quality checks with issue reporting

### Advanced Features
- 🔌 **Feature Flags** - Enable/disable features without code changes
- 🏗️ **Modular Architecture** - Clean feature-based folder structure
- 🚀 **Production Ready** - Optimized build, Docker support, Railway deployment

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Local Development
```bash
npm run dev
```
Visit `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
npm start  # Starts Express server on port 3000
```

### 4. Using the App
1. **Create a Client** - Click "Add Client"
2. **Upload CSV** - Select a CSV file with tenant inquiry data
3. **Auto-Period Creation** - Data automatically grouped by calendar month
4. **View Analytics** - Period overview shows all periods with quick stats
5. **Click Period** - View full KPI dashboard with 40+ metrics and charts
6. **Compare Trends** - Select 2+ periods to view trend analysis

---

## 🏗️ Architecture

### Project Structure

```
src/
├── features/                          # Feature-based organization
│   ├── periodManagement/
│   │   ├── components/
│   │   │   └── PeriodOverview.jsx     # Period grid and KPI display
│   │   └── index.js
│   ├── analytics/
│   │   ├── components/
│   │   │   └── KPIDashboard.jsx       # 40+ KPI metrics & charts
│   │   └── index.js
│   ├── trendAnalysis/
│   │   ├── components/
│   │   │   └── TrendComparisonView.jsx # MoM%, growth, rankings
│   │   ├── services/
│   │   │   └── trendAnalysisService.js # Trend calculations
│   │   └── index.js
│   ├── aiIntegration/
│   │   ├── components/
│   │   │   └── AISettingsPanel.jsx     # API configuration
│   │   ├── services/
│   │   │   ├── aiAnalyticsService.js   # OpenAI/Claude APIs
│   │   │   └── chunkingService.js      # 7-day chunking
│   │   └── index.js
│   ├── userManagement/
│   │   ├── components/
│   │   │   └── UserManagementUI.jsx
│   │   ├── services/
│   │   │   └── userManagement.js       # Roles & permissions
│   │   └── index.js
│   ├── clientManagement/               # (ready for expansion)
│   └── csvUpload/                      # (ready for expansion)
├── services/
│   ├── storage.js                      # localStorage CRUD
│   └── autoPeriodDetection.js          # Calendar month detection
├── constants/
│   └── featureFlags.js                 # Feature configuration
├── App.jsx                             # Main component
└── main.jsx                            # Entry point
```

### Data Flow

```
CSV Upload
  ↓
Parse CSV with PapaParse
  ↓
Check: File size > 7 days?
  ├─ YES → Chunk into 7-day segments
  │         Send each to AI (if enabled)
  │         Aggregate results
  └─ NO → Direct processing
  ↓
Auto-detect Calendar Months
  ↓
Calculate 40+ KPIs (base + AI insights)
  ↓
Create Periods
  ↓
Store in localStorage
  ↓
Auto-show Period Overview
```

---

## 🎛️ Feature Flags

Control features without code changes. Located in `src/constants/featureFlags.js`

### Available Flags

```javascript
FEATURE_FLAGS = {
  CLIENT_MANAGEMENT: true,      // Client CRUD operations
  CSV_UPLOAD: true,             // CSV file uploads
  PERIOD_MANAGEMENT: true,      // Period overview & details
  ANALYTICS_DASHBOARD: true,    // KPI dashboard display
  TREND_ANALYSIS: true,         // Multi-period comparison
  AI_INTEGRATION: true,         // AI API support
  AI_SETTINGS_PANEL: true,      // Settings configuration
  AI_CHUNKING: true,            // Auto 7-day chunking
  USER_MANAGEMENT: false,       // Disabled by default
}
```

### Enable/Disable Features

**Option 1: Build-time (Environment Variables)**
```bash
# Disable trend analysis for build
VITE_FEATURE_TREND_ANALYSIS=false npm run build

# Disable all AI features
VITE_FEATURE_AI_INTEGRATION=false VITE_FEATURE_AI_SETTINGS_PANEL=false npm run build
```

**Option 2: Runtime (localStorage)**
```javascript
import { setFeatureFlag, getAllFeatureFlags, resetFeatureFlags } from './constants/featureFlags'

// Toggle features at runtime
setFeatureFlag('TREND_ANALYSIS', false)
setFeatureFlag('AI_INTEGRATION', true)

// Check all flags
console.log(getAllFeatureFlags())

// Reset to defaults
resetFeatureFlags()
```

**Option 3: In App.jsx (Conditional Rendering)**
```javascript
import FEATURE_FLAGS from './constants/featureFlags'

{FEATURE_FLAGS.TREND_ANALYSIS && <TrendAnalysisButton />}
{FEATURE_FLAGS.AI_INTEGRATION && <AISettingsPanel />}
```

---

## 📊 KPI Dashboard

The dashboard displays 40+ metrics across multiple categories:

### Key Metrics (8 Cards)
- Total Inquiries
- Success Rate
- Average Response Time
- Average Resolution Time
- Data Quality Score
- Average Conversation Length
- Working Hours % / After Hours %

### Charts & Visualizations
- **Pie Charts:** Deficiency types, Satisfaction distribution, Report success
- **Bar Charts:** Working hours vs. after hours, Inquiries by hour
- **Line Charts:** Cost estimates by category
- **Data Quality Issues:** Validation problems with counts

### Additional Metrics (8 Cards)
- Inside/Outside working hours counts
- Successful/Failed reports
- Satisfied/Frustrated/Neutral users
- Data quality issues count

### AI-Enhanced Insights (if AI enabled)
- Trends observed in period
- Anomalies detected
- Actionable recommendations
- Cost analysis

---

## 📈 Trend Analysis

Compare multiple periods with:

- **Month-over-Month Change** - % change between consecutive periods
- **Growth Trends** - Linear regression slope, start/end values, growth rate
- **Comparative Rankings** - Rank periods 1-n for each KPI
- **AI Analysis** - AI-generated trends, insights, and forecasts

### How to Use
1. Create periods by uploading CSVs
2. Navigate to client detail view
3. Click "Trend Analysis" button
4. Select 2+ periods from checkboxes
5. Switch between tabs to view different analyses

---

## 🤖 AI Integration

### Setup

1. **Configure API Keys:**
   - Click AI Settings panel (top of client view)
   - Select provider: **OpenAI** or **Claude**
   - Enter API key
   - Click "Test Connection"

2. **Enable Auto-Chunking:**
   - Toggle enabled in settings
   - Files >7 days auto-chunk into 7-day segments
   - Each chunk sent to AI for analysis
   - Results aggregated into single period

### Supported Providers

#### OpenAI (GPT-4)
- Model: `gpt-4-turbo`
- Request: Analytics summary
- Response: Structured JSON with trends, anomalies, insights, recommendations

#### Claude (Claude 3.5 Sonnet)
- Model: `claude-3-5-sonnet-20241022`
- Request: Analytics summary
- Response: Structured JSON with identical format as OpenAI

### CSV Chunking Strategy

For files spanning >7 days:
1. Extract min/max dates from CSV
2. Create 7-day windows
3. Filter CSV rows by date range
4. Send each chunk to AI

**Aggregation:**
- **Sum:** Counts (inquiries, hours, reports)
- **Weighted Average:** Time-based metrics (response time, resolution time)
- **Recalculate:** Percentages (success rate, satisfaction rate)
- **Merge:** Deficiency data, cost data, hourly data

---

## 📋 CSV Format

Your CSV file must contain these columns:

```csv
Content,MessageType,TimeSent,ConversationId
"Hello, I need help",1,2024-01-15 09:30:45.1234567,conv-001
"Can you assist?",3,2024-01-15 09:31:12.7654321,conv-001
"Of course!",1,2024-01-15 09:31:45.0000000,conv-001
```

**Column Details:**
- **Content** - Message text
- **MessageType** - 1 (AI), 3 (Tenant), 5 (Tool)
- **TimeSent** - Timestamp: `YYYY-MM-DD HH:MM:SS.mmmmmmm`
- **ConversationId** - Unique conversation identifier

**Supported Formats:**
- `.csv` files
- UTF-8 encoding
- With or without header row
- Any number of rows (tested up to 100k+)

---

## 🚀 Deployment

### Option 1: Railway (Recommended for Node.js apps)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Files included:**
- `Dockerfile` - Container configuration
- `railway.json` - Railway settings
- `server.js` - Express server

### Option 2: Netlify

**Method 1: Drag & Drop (Fastest)**
```bash
npm install
npm run build
```
- Go to https://app.netlify.com/drop
- Drag `dist` folder
- Done!

**Method 2: GitHub Integration (Auto-deploy)**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO
git push -u origin main

# Go to netlify.com
# Click "Add new site" → "Import existing project"
# Select GitHub repo → Auto-deploy on every push
```

**Method 3: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Option 3: Docker

```bash
# Build image
docker build -t tenant-analytics .

# Run container
docker run -p 3000:3000 tenant-analytics

# Visit http://localhost:3000
```

### Option 4: Manual Build & Deploy

```bash
npm install
npm run build
npm start
```

Visit `http://localhost:3000`

---

## 💻 Development

### Local Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting (if configured)
npm run lint
```

### Adding a New Feature

1. **Create feature folder:**
   ```bash
   mkdir -p src/features/myFeature/{components,services,hooks}
   ```

2. **Create components/services:**
   - `src/features/myFeature/components/MyComponent.jsx`
   - `src/features/myFeature/services/myService.js`

3. **Create `index.js`:**
   ```javascript
   export { default as MyComponent } from './components/MyComponent'
   export * from './services/myService'
   ```

4. **Add feature flag:**
   ```javascript
   // src/constants/featureFlags.js
   MY_NEW_FEATURE: getFeatureFlag('MY_NEW_FEATURE', true),
   ```

5. **Use in App:**
   ```javascript
   import { MyComponent } from './features/myFeature'
   import FEATURE_FLAGS from './constants/featureFlags'

   {FEATURE_FLAGS.MY_NEW_FEATURE && <MyComponent />}
   ```

### Best Practices

- **Feature Isolation** - Each feature independent and testable
- **Avoid Cross-Feature Imports** - Use shared services instead
- **Use Index.js** - Cleaner imports via feature folders
- **Feature Dependencies** - Check flags before using dependent features

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, JSX |
| **Build Tool** | Vite 5.4 |
| **Styling** | Tailwind CSS, custom CSS |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **CSV Parsing** | PapaParse |
| **State Management** | React Hooks, localStorage |
| **Server** | Express (Node.js) |
| **Containerization** | Docker |
| **UI Components** | Custom React components |

---

## 📱 Browser Support

✅ Chrome/Edge (recommended)
✅ Firefox
✅ Safari
✅ Any modern browser with localStorage
✅ Mobile/tablet responsive

**Requirements:**
- localStorage enabled
- JavaScript enabled
- Modern CSS support (Flexbox, Grid)

---

## 💾 Data Storage

- **Location:** Browser localStorage (client-side only)
- **Privacy:** No data sent to external servers (except AI APIs if configured)
- **Persistence:** Data survives page refreshes, cleared only by user
- **Capacity:** 5-10MB typical (varies by browser)
- **Isolation:** Each browser/user has separate data

### Storage Keys

```javascript
'tenant_analytics_clients'        // Client data
'tenant_analytics_settings'       // App settings
'tenant_analytics_ai_settings'    // AI configuration
'feature_*'                       // Feature flag overrides
```

---

## 🆘 Troubleshooting

### Build Issues

**Error: "Could not resolve module"**
- Check import paths use correct relative paths
- Ensure all files are in src/ directory
- Run `npm install` to restore dependencies

**Build fails on line X**
- Check syntax errors
- Run `npm run build` for detailed error message
- Verify file paths in imports

### Runtime Issues

**Page is blank**
- Open browser console (F12) for error messages
- Check if JavaScript is enabled
- Clear cache and hard reload (Ctrl+Shift+R)

**Data not persisting**
- Check if localStorage is enabled
- Not in incognito/private mode (localStorage disabled there)
- Check localStorage quota: `localStorage.getItem('tenant_analytics_clients')`

**CSV upload fails**
- Verify CSV has required columns
- Check file encoding (UTF-8)
- Ensure date format is correct (YYYY-MM-DD HH:MM:SS)

**AI features not working**
- Verify API key is correct
- Check API key has proper permissions
- Ensure you have account credits
- Click "Test Connection" to debug

---

## 📝 API Endpoints (Express Server)

When running `npm start`:

```
GET  /              → Serve index.html
GET  /assets/*      → Serve static assets
POST /              → SPA catch-all (→ index.html)
```

All data stored client-side, no backend API calls.

---

## 📚 Documentation Files

- **FEATURE_STRUCTURE.md** - Detailed architecture and feature flag usage
- **README.md** - This file
- Additional documentation available for specific features

---

## 🤝 Support & Contributing

**Issues?** Check the troubleshooting section above.

**Feature Requests?** Add a feature folder following the pattern in "Adding a New Feature" section.

**Improvements?** Follow the development guidelines and create a pull request.

---

## 📄 License

MIT License - Feel free to use this project for any purpose.

---

## ⚡ Quick Commands Reference

```bash
# Development
npm install          # Install dependencies
npm run dev         # Start dev server (localhost:3000)
npm run build       # Production build
npm start           # Start Express server

# Deployment
docker build -t app .           # Build Docker image
docker run -p 3000:3000 app    # Run container

# Feature Flags (build-time)
VITE_FEATURE_TREND_ANALYSIS=false npm run build

# Feature Flags (runtime - in browser console)
import { setFeatureFlag } from './constants/featureFlags'
setFeatureFlag('AI_INTEGRATION', false)
```

---

**Last Updated:** January 2024 | **Version:** 2.0 (Modular Architecture)
