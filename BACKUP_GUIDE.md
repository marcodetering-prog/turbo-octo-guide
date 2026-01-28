# 💾 LocalStorage Backup & Restore Guide

## Overview

Your Tenant Analytics Dashboard now includes comprehensive backup and restore functionality to protect your data and enable migration between browsers/devices.

## 🔄 Features

### 1. **Export All Data**
- Backs up ALL clients and their periods
- Creates a JSON file with complete data
- Includes metadata (export date, version, counts)
- File naming: `tenant-analytics-backup-YYYY-MM-DD.json`

### 2. **Export Single Client**
- Backs up one specific client and all their periods
- Perfect for sharing specific client data
- File naming: `client-name-backup-YYYY-MM-DD.json`

### 3. **Import Data**
- Restore from backup files
- Merges with existing data (doesn't overwrite)
- Validates data before importing
- Confirmation prompts for safety

### 4. **Clear All Data**
- Complete data wipe
- Triple confirmation required
- Cannot be undone
- Use with extreme caution

---

## 📖 How to Use

### Exporting All Data

1. Click the **"Backup & Restore"** button in the top right
2. Select **"Export All Data"**
3. A JSON file will download automatically
4. **Save this file securely** (recommended: cloud storage, external drive)

**When to use:**
- Before major updates
- Regular backups (weekly/monthly)
- Before clearing browser data
- When switching devices/browsers

---

### Exporting Single Client Data

1. Find the client card on the main screen
2. Click the **download icon** (📥) on the client card
3. JSON file downloads with that client's data only

**When to use:**
- Sharing data with team members
- Client-specific backups
- Migrating individual clients to another system

---

### Importing Data

1. Click **"Backup & Restore"** → **"Import Data"**
2. Select your backup JSON file
3. Review the confirmation message showing:
   - Number of clients to import
   - Number of periods to import
4. Click **OK** to confirm
5. Data imports and merges with existing data

**Important Notes:**
- Import **merges** data (doesn't delete existing)
- Duplicate clients will be added (not replaced)
- If you want to replace, clear data first then import

---

### Clearing All Data

1. Click **"Backup & Restore"** → **"Clear All Data"**
2. **Confirm** deletion (1st prompt)
3. **Confirm** again (2nd prompt)
4. **Type "DELETE"** to final confirm
5. All data removed

⚠️ **WARNING:** This is permanent and cannot be undone!

**Always export backup before clearing!**

---

## 🗂️ Backup File Structure

```json
{
  "version": "1.0",
  "exportDate": "2025-01-27T20:00:00.000Z",
  "clients": [
    {
      "id": "1234567890",
      "name": "Client Name",
      "periods": [
        {
          "id": "9876543210",
          "startDate": "2025-01-01",
          "endDate": "2025-01-31",
          "fileName": "data.csv",
          "uploadedAt": "2025-01-27T20:00:00.000Z",
          "analytics": { /* all calculated metrics */ }
        }
      ],
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "totalClients": 1,
  "totalPeriods": 1
}
```

---

## 💡 Best Practices

### Regular Backups
- **Weekly:** Export all data every week
- **Before Updates:** Always backup before major changes
- **Multiple Locations:** Store backups in 2+ places (cloud + local)

### Backup Storage Recommendations
- ✅ Google Drive / Dropbox / OneDrive
- ✅ External hard drive
- ✅ Company network drive
- ✅ Email to yourself (for small backups)
- ❌ Only on same device as app

### Organization
- Use consistent naming: `backup-2025-01-27-weekly.json`
- Keep last 4 weekly backups minimum
- Archive old backups (don't delete)

### Security
- Backups contain your analytics data
- Store in secure, encrypted locations
- Don't share publicly
- Consider encrypting sensitive backups

---

## 🔧 Use Cases

### Scenario 1: Browser Crash / Data Loss
**Problem:** Browser cleared, data gone
**Solution:**
1. Open dashboard in browser
2. Import most recent backup
3. All data restored

### Scenario 2: Switching Devices
**Problem:** Moving from laptop to desktop
**Solution:**
1. Export data from old device
2. Transfer JSON file (email, USB, cloud)
3. Import on new device
4. Continue working

### Scenario 3: Team Collaboration
**Problem:** Need to share client data with colleague
**Solution:**
1. Export single client data
2. Send JSON file to colleague
3. They import into their dashboard
4. Both can now analyze that client

### Scenario 4: Accidental Deletion
**Problem:** Accidentally deleted important client
**Solution:**
1. Import yesterday's backup
2. Merge restores deleted client
3. Data recovered

### Scenario 5: Testing / Development
**Problem:** Want to test features without risking real data
**Solution:**
1. Export backup (safety net)
2. Clear all data
3. Import test data / experiment freely
4. Re-import real backup when done

---

## 🚨 Troubleshooting

### Import Fails
**Error:** "Invalid backup file format"
- **Cause:** Corrupted or wrong file
- **Fix:** Try different backup file

### No Download Happens
**Error:** Nothing downloads when clicking export
- **Cause:** Browser blocking downloads
- **Fix:** Check browser permissions, allow downloads from site

### Data Not Appearing After Import
**Error:** Imported but don't see data
- **Cause:** Import was successful but screen didn't refresh
- **Fix:** Refresh page (F5)

### Large File Size
**Issue:** Backup files are very large (>10MB)
- **Cause:** Many periods with large CSV data
- **Fix:** Export individual clients instead of all data

### Can't Type "DELETE"
**Issue:** Final confirmation isn't working
- **Cause:** Must type exactly "DELETE" (all caps)
- **Fix:** Type: D-E-L-E-T-E (all uppercase)

---

## 📊 What Gets Backed Up

### Included in Backup:
✅ All client names and IDs
✅ All period date ranges
✅ All calculated analytics (KPIs, charts, validation)
✅ Original CSV file names
✅ Upload timestamps
✅ Client creation dates

### NOT Included in Backup:
❌ Original CSV raw data
❌ User preferences/settings
❌ Browser-specific data

**Note:** You don't need to store original CSVs if you keep backups, as all analytics are pre-calculated and stored.

---

## 🔐 Data Privacy

### Where is Data Stored?
- **Primary:** Browser localStorage (your device only)
- **Backups:** JSON files you download (you control)
- **Network:** NO data sent to any server

### Who Can Access Data?
- **You:** Complete access on your device
- **Others:** Only if you share backup files
- **Us (Developers):** Zero access, never transmitted

### Data Security
- All data stays on your device
- Backups are unencrypted JSON (your responsibility to secure)
- Consider encrypting sensitive backup files
- Use secure cloud storage with password protection

---

## 📅 Recommended Backup Schedule

### Small Team (1-5 clients)
- **Daily:** Not necessary
- **Weekly:** Export all data
- **Before Major Work:** Quick export

### Medium Team (5-20 clients)  
- **Daily:** If doing lots of uploads
- **Weekly:** Full backup
- **Monthly:** Archive old backups

### Large Organization (20+ clients)
- **Daily:** Full backup
- **Per-Upload:** Export single client after major uploads
- **Weekly:** Verify backup integrity
- **Monthly:** Archive and organize

---

## 🎓 Advanced Tips

### 1. Automated Reminders
Set calendar reminders to backup:
- Every Monday morning
- Before quarter-end
- Before system updates

### 2. Version Control
Keep multiple backup versions:
```
backups/
├── 2025-01-weekly/
│   ├── backup-2025-01-06.json
│   ├── backup-2025-01-13.json
│   ├── backup-2025-01-20.json
│   └── backup-2025-01-27.json
└── 2025-01-monthly/
    └── backup-2025-01-31.json
```

### 3. Backup Testing
Periodically test your backups:
1. Export data
2. Clear all data (scary but do it!)
3. Import backup
4. Verify everything restored

### 4. Selective Import
To import only specific clients:
1. Open backup JSON in text editor
2. Delete unwanted client objects
3. Save modified file
4. Import modified file

---

## ✅ Checklist

**Before Clearing Browser Data:**
- [ ] Export all data
- [ ] Verify file downloaded
- [ ] Open file to confirm it's valid JSON
- [ ] Store in 2+ locations

**After Installing Update:**
- [ ] Export backup first
- [ ] Update app
- [ ] Test core functions
- [ ] Keep backup for rollback if needed

**Monthly Maintenance:**
- [ ] Export full backup
- [ ] Archive old backups
- [ ] Test import on test device
- [ ] Delete very old backups (>6 months)

---

## 📞 Support

If you have issues with backup/restore:
1. Check browser console for errors (F12)
2. Try different browser
3. Verify JSON file is valid (open in text editor)
4. Export again if file seems corrupted

Remember: **Backups are your safety net!** Make them regularly and store them safely.

---

**Happy Backing Up! 💾**
