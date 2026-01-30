# Conversation Data Parser & Analyzer

A clean, minimal application for parsing tenant-support conversation CSV files into structured, analyzable data.

**Status:** ✅ Production-ready | **Build:** ✅ Passing | **Bundle:** 1260 modules | **Size:** 20.78 KB gzipped

---

## 📋 Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [CSV Format](#csv-format)
5. [Data Structure](#data-structure)
6. [Development](#development)
7. [Tech Stack](#tech-stack)

---

## ✨ Features

### Core Features
- 📊 **Client Management** - Create and manage multiple analysis projects
- 📤 **CSV Upload** - Parse conversation data with progress tracking
- 🔍 **Data Structuring** - Automatically extract and organize conversation data
- 👤 **Tenant Info Extraction** - Extract names, emails, phone numbers, addresses
- 📝 **Issue Recognition** - Identify and categorize issues from conversations
- 📈 **Summary Statistics** - Generate data overview and metrics
- 💾 **Persistent Storage** - Save parsed data to browser localStorage
- 🎨 **Expandable UI** - Drill down into individual conversations

### What It Does
1. Parses CSV files containing conversation transcripts
2. Groups messages by ConversationId
3. Extracts structured information (tenant details, issue description)
4. Normalizes data formats (phone numbers, dates, content)
5. Generates summary statistics
6. Displays clean, organized conversation view

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
npm start  # Starts Express server
```

### 4. Using the App
1. **Create a Client** - Click "Add Client" button
2. **Upload CSV** - Select your conversation CSV file
3. **View Data Summary** - Statistics appear immediately
4. **Explore Conversations** - Click to expand any conversation
5. **View Details** - See extracted tenant info, issues, and message threads

---

## 🏗️ Architecture

### Project Structure

```
src/
├── features/
│   ├── clientManagement/                    # Client CRUD & data display
│   │   ├── components/
│   │   │   ├── ClientManagement.jsx        # Client list view
│   │   │   ├── ClientDetail.jsx            # Data display & upload
│   │   │   └── UploadSection.jsx           # CSV upload UI
│   │   ├── services/
│   │   └── index.js
│   └── periodManagement/                    # (Ready for expansion)
├── services/
│   ├── dataParserService.js                # CSV parsing & structuring
│   ├── storage.js                          # localStorage management
│   └── config/
│       └── uiStrings.json                  # UI text strings
├── components/
│   ├── ProgressBar.jsx                     # File upload progress
│   └── (shared UI components)
├── App.jsx                                 # Main app component
└── main.jsx                                # Entry point
```

### Data Flow

```
CSV Upload
    ↓
PapaParse (split into rows)
    ↓
parseAndStructureData()
    ├─ Group by ConversationId
    ├─ Sort messages by timestamp
    ├─ Extract tenant info (regex patterns)
    └─ Extract issue description
    ↓
getDataSummary()
    ├─ Count conversations
    ├─ Count messages
    ├─ Calculate statistics
    └─ Extract unique tenants
    ↓
Display in UI
    ├─ Show summary statistics
    └─ Show expandable conversations
    ↓
Save to localStorage
```

### Parser Service

**File:** `src/services/dataParserService.js`

**Key Functions:**
- `parseAndStructureData(csvData)` - Main parser function
  - Input: Array of CSV rows
  - Output: Structured conversation object

- `getDataSummary(parsedData)` - Statistics generator
  - Input: Parsed data
  - Output: Summary metrics

**Information Extracted:**
- **Tenant Name** - From salutations (Herr/Frau) and "name is" patterns
- **Phone Number** - Swiss format (+41, 0041, 0) with normalization
- **Email Address** - Standard email pattern matching
- **Address** - Street name + number extraction
- **Issue Description** - First tenant message in conversation
- **Message Duration** - Time span from first to last message
- **Message Counts** - By type (tenant, support, analysis)

---

## 📋 CSV Format

Your CSV file must contain these columns:

```csv
Content,MessageType,TimeSent,ConversationId
"in meiner wohnung brennt es!!",3,2025-03-24 08:39:41.3790098,eea7c78b-14f3-452d-8f8c-08dd67bf29fc
"Bitte rufen Sie sofort die Feuerwehr an",1,2025-03-24 08:39:45.3342241,eea7c78b-14f3-452d-8f8c-08dd67bf29fc
```

**Column Details:**
| Column | Type | Format | Example |
|--------|------|--------|---------|
| Content | string | Any text | "message text" |
| MessageType | number | 1, 3, 5, 6 | 3 |
| TimeSent | datetime | YYYY-MM-DD HH:MM:SS.mmmmmmm | 2025-03-24 08:39:41.3790098 |
| ConversationId | string | UUID/ID | eea7c78b-14f3-452d-8f8c-08dd67bf29fc |

**Message Types:**
- `1` = Support/Agent response
- `3` = Tenant message
- `5` = AI analysis/tool call
- `6` = Image/attachment

**CSV Requirements:**
- UTF-8 encoding
- Comma-separated values
- With header row
- Any number of rows (tested up to 100k+)

---

## 📊 Data Structure

### Parsed Conversation Object

```javascript
{
  conversationId: "eea7c78b-14f3-452d-8f8c-08dd67bf29fc",
  firstMessageTime: "2025-03-24 08:39:41.3790098",
  lastMessageTime: "2025-03-24 08:39:46.4716425",
  durationHours: 0.001,
  messageCount: 3,
  tenantMessageCount: 2,
  supportMessageCount: 1,
  tenant: {
    name: "Alexander Fiegl",
    phone: "0796034140",
    email: "c.bachmann@peterhalter.com",
    address: "Badenerstrasse 733"
  },
  issue: "in meiner wohnung brennt es!!",
  messages: [
    {
      timestamp: "2025-03-24 08:39:41.3790098",
      type: "tenant",
      content: "in meiner wohnung brennt es!!"
    },
    {
      timestamp: "2025-03-24 08:39:45.3342241",
      type: "support",
      content: "Bitte rufen Sie sofort die Feuerwehr an"
    }
  ]
}
```

### Summary Statistics

```javascript
{
  totalConversations: 42,
  totalMessages: 1250,
  averageMessagesPerConversation: 29.8,
  averageDurationHours: 4.5,
  uniqueTenants: 35,
  tenantsWithPhone: 32,
  tenantsWithEmail: 28,
  tenantsWithAddress: 25
}
```

---

## 💻 Development

### Local Setup

```bash
# Install dependencies
npm install

# Start dev server (auto-reload on changes)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Format code (if ESLint configured)
npm run lint
```

### Adding Features

**1. Create a new service:**
```javascript
// src/services/myService.js
export const myFunction = (data) => {
  // Process data
  return result;
}
```

**2. Create a new component:**
```javascript
// src/features/myFeature/components/MyComponent.jsx
import React from 'react';

export default function MyComponent({ data }) {
  return <div>{/* UI */}</div>;
}
```

**3. Use in ClientDetail or other components:**
```javascript
import { myFunction } from '../../../services/myService';
import MyComponent from './MyComponent';

// In component
const result = myFunction(parsedData);
```

### Best Practices

- **Keep services pure** - No side effects, just data transformation
- **Use descriptive names** - Function/variable names should be self-documenting
- **Separate concerns** - UI in components, logic in services
- **No external dependencies** - Use what's already installed
- **Test with real data** - Use your actual CSV format

### Modifying the Parser

The parser is in `src/services/dataParserService.js`. Key areas to modify:

**Extract different data:**
```javascript
const extractYourData = (messages) => {
  // Add your extraction logic
  return result;
}
```

**Change patterns:**
```javascript
// Current pattern for names
const nameMatch = allContent.match(/(Herr|Frau|Mr|Ms|Mme|M\.)\s+(.+)/i);

// Modify to match your data format
```

**Add new extraction:**
```javascript
// In processConversation function
const yourData = extractYourData(messages);

// In return object
return {
  conversationId,
  tenant,
  issue,
  yourData,  // Add your extracted data
  messages
}
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI framework |
| **Build Tool** | Vite 5.4 | Fast builds |
| **Styling** | Tailwind CSS | Utility CSS |
| **Icons** | Lucide React | Icon library |
| **CSV Parsing** | PapaParse | CSV parsing |
| **State** | React Hooks | State management |
| **Storage** | localStorage | Client-side data |
| **Server** | Express (Node.js) | Static file serving |
| **Container** | Docker | Deployment |

---

## 💾 Data Storage

**Location:** Browser localStorage (client-side only)

**Privacy:** No data sent to external servers

**Keys:**
```javascript
'tenant_analytics_clients'      // Client list and parsed data
'tenant_analytics_settings'     // App settings
```

**How to Access:**
```javascript
// In browser console
localStorage.getItem('tenant_analytics_clients')
JSON.parse(localStorage.getItem('tenant_analytics_clients'))
```

---

## 📱 Browser Support

✅ Chrome/Edge (recommended)
✅ Firefox
✅ Safari
✅ Any modern browser with:
  - localStorage support
  - JavaScript ES6+
  - CSS Flexbox/Grid

---

## 🚀 Deployment

### Option 1: Railway (Recommended)
```bash
npm install -g @railway/cli
railway login
railway up
```

### Option 2: Netlify
```bash
npm run build
# Drag dist/ folder to https://app.netlify.com/drop
```

### Option 3: Docker
```bash
docker build -t app .
docker run -p 3000:3000 app
```

### Option 4: Manual
```bash
npm install
npm run build
npm start
# Visit http://localhost:3000
```

---

## 🆘 Troubleshooting

**Build fails:**
- Run `npm install` to restore dependencies
- Check for syntax errors in code

**Page is blank:**
- Open browser console (F12) for error messages
- Check if JavaScript is enabled
- Clear cache: Ctrl+Shift+R

**Data not persisting:**
- Check if localStorage is enabled
- Not in incognito/private mode
- Check localStorage quota in DevTools

**CSV upload fails:**
- Verify CSV has required columns
- Check file encoding (UTF-8)
- Ensure date format: YYYY-MM-DD HH:MM:SS

**Parser not extracting data:**
- Check CSV data matches expected format
- Open browser console to see parsing results
- Verify message types are correct (1, 3, 5, 6)

---

## 📝 Commands Reference

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Production build
npm start               # Start Express server

# Docker
docker build -t app .   # Build image
docker run -p 3000:3000 app    # Run container

# Local testing
npm run build && npm start
# Visit http://localhost:3000
```

---

## 📄 License

MIT License - Use freely for any purpose.

---

**Last Updated:** January 2025 | **Version:** 1.0 (Clean Data Parser)
