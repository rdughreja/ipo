# 📈 IPO Application Tracker

A simple, offline-first web dashboard to track IPO applications across multiple accounts without needing a backend server.

## Features

- ✅ Track multiple IPO applications
- 📅 Monitor application last dates and listing dates
- 👥 Manage applications across different accounts (yours, family members, etc.)
- 🏦 Track which UPI ID or bank was used for each application
- ✓ Mark applications as successful or money returned
- 💾 Data persists in browser (localStorage)
- 📤 Export/Import data as JSON backup
- 📱 Mobile-friendly responsive design
- 🚀 No backend required - pure HTML/CSS/JavaScript

## How to Use

### Running Locally

1. Simply open `index.html` in any modern web browser
2. No installation or setup required!

### Hosting on GitHub Pages

1. Create a new GitHub repository
2. Upload these files:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. Go to repository Settings → Pages
4. Select branch `main` and folder `/root`
5. Click Save
6. Your dashboard will be live at `https://yourusername.github.io/your-repo-name/`

## Usage Guide

### Adding an IPO

1. Click "Add New IPO" button
2. Fill in:
   - IPO Name (e.g., "Claude IPO")
   - Application Last Date
   - Listing Date
3. Add applications:
   - Account Holder Name (e.g., "My Account", "Father's Account")
   - UPI ID / Bank Used (e.g., "SBI", "Axis UPI")
4. Click "Save IPO"

### Managing Applications

- **Mark as Successful**: Click the checkbox next to an application when allotment is successful
- **Edit IPO**: Click the ✏️ icon to edit IPO details
- **Delete IPO**: Click the 🗑️ icon to remove an IPO

### Data Backup

- **Export**: Click "Export Data" to download a JSON backup file
- **Import**: Click "Import Data" to restore from a backup file

## Technical Details

- **Storage**: Browser localStorage (data persists until you clear browser data)
- **Compatibility**: Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- **File Size**: ~20KB total (very lightweight)

## Important Notes

⚠️ **Data Persistence**: 
- Data is saved in your browser's localStorage
- Clearing browser data will delete all IPO records
- Use Export feature regularly to backup your data
- Each browser/device has separate data (use Export/Import to sync)

## Example Use Case

You apply for "XYZ IPO" from:
- Your account using SBI UPI ✓
- Father's account using Axis UPI ⏳ (pending)
- Mother's account using SBI UPI ✓

The dashboard tracks all three applications in one place with clear status indicators.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

Free to use and modify for personal and commercial use.
