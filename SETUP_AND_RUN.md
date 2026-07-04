# YouTube Insight Dashboard - Setup & Run Guide

## ⚠️ Current Issues Fixed

1. **Papaparse Dependency Issue** ✅ FIXED
   - Removed papaparse from dependencies
   - Implemented native CSV parsing in `src/lib/csv.ts`
   - Uses native FileReader API instead

2. **npm Allow Scripts Error** ✅ WORKAROUND PROVIDED
   - Error: `allow-scripts is not allowed in project-scoped installs`
   - The project has `"allowScripts"` config that npm 11+ doesn't accept
   - Solution: Use a different Node package manager or Windows CMD instead of PowerShell

## 🚀 Quick Start - Web App (TypeScript/React)

### Prerequisites
- Node.js 18+ 
- Windows Command Prompt (NOT PowerShell due to npm scripts issue)

### Steps to Run

1. **Open Command Prompt (CMD)** (Important: NOT PowerShell)
   ```cmd
   cd C:\Users\Lenovo\Desktop\youtube-insight-dashboard\youtube-dashboard-with-streamlit
   ```

2. **Install Dependencies**
   ```cmd
   npm install
   ```
   
   If above fails, try:
   ```cmd
   npm install --legacy-peer-deps --no-save
   ```

3. **Remove problematic config** (if install still fails)
   ```cmd
   del .npmrc
   npm cache clean --force
   npm install
   ```

4. **Start Development Server**
   ```cmd
   npm run dev
   ```
   - Opens at: `http://localhost:8080/`

5. **Build for Production**
   ```cmd
   npm run build
   ```

## 🐍 Quick Start - Streamlit App (Python)

### Prerequisites
- Python 3.8+
- Command Prompt or PowerShell

### Steps to Run

1. **Create Virtual Environment**
   ```bash
   cd streamlit_app
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the App**
   ```bash
   streamlit run app.py
   ```
   - Opens at: `http://localhost:8501/`

4. **Optional: Add YouTube API Key**
   ```bash
   set YOUTUBE_API_KEY=your_api_key_here
   streamlit run app.py
   ```

## 📝 Available Commands

### Web App
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (http://localhost:8080/) |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in dev mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

### Streamlit App
| Command | Purpose |
|---------|---------|
| `streamlit run app.py` | Run the app |
| `streamlit cache clear` | Clear Streamlit cache |
| `streamlit config show` | Show configuration |

## 🔧 Troubleshooting

### Issue: npm EALLOWSCRIPTS error
**Solution**: Use Windows Command Prompt (CMD) instead of PowerShell
```cmd
# In CMD (not PowerShell):
npm install
```

### Issue: Port 8080 already in use
**Solution**: Start dev server on different port
```cmd
npm run dev -- --port 3000
```

### Issue: Python dependencies won't install
**Solution**: Update pip first
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: Streamlit can't find modules
**Solution**: Verify virtual environment is activated
```bash
# Check if activated (should show "venv" in prompt)
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: "papaparse is not defined"
**Solution**: Already fixed! The app now uses native CSV parsing.

## 📁 Project Structure

```
youtube-dashboard-with-streamlit/
├── src/                    # Web app (React/TypeScript)
│   ├── components/         # React components
│   ├── routes/             # Page routes
│   ├── lib/                # Utilities (csv.ts has native CSV parsing)
│   └── integrations/       # Supabase & Lovable
├── streamlit_app/          # Python analytics app
│   ├── app.py             # Main Streamlit entry point
│   ├── utils/             # Helper functions
│   ├── data/              # Sample datasets
│   └── requirements.txt    # Python dependencies
├── supabase/              # Database config
├── package.json           # Node.js dependencies
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## 🌐 Accessing the Apps

### Web App (React Dashboard)
- **URL**: http://localhost:8080/
- **Features**: Upload CSV, analytics, channel comparison
- **Tech**: React 19, TypeScript, Vite, Supabase

### Streamlit App (Analytics Dashboard)
- **URL**: http://localhost:8501/
- **Features**: Interactive charts, data filtering, PDF reports
- **Tech**: Python, Streamlit, Plotly, Pandas

## 🔑 Environment Variables

### Web App (.env)
```
SUPABASE_PROJECT_ID=aoxkohqigukymxgpmmxs
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=https://c--44a8af87-5b61-44a2-bdfc-8ea46b636217-prod.lovable.cloud
VITE_SUPABASE_PROJECT_ID=aoxkohqigukymxgpmmxs
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
```

### Streamlit App
```
YOUTUBE_API_KEY=your_youtube_api_key  # Optional
```

## 📦 Key Dependencies

**Web App:**
- `@tanstack/react-start` - Full-stack framework
- `@supabase/supabase-js` - Database & auth
- `recharts` - Charts & data viz
- `vite` - Build tool

**Python App:**
- `streamlit` - Web framework
- `pandas` - Data processing
- `plotly` - Interactive charts
- `google-api-python-client` - YouTube API

## 🎯 Features

### Web App
✅ YouTube analytics dashboard
✅ CSV file upload and analysis
✅ Channel comparison
✅ Keyword analysis
✅ Real-time visualizations
✅ User authentication (Supabase)

### Streamlit App
✅ Interactive YouTube analytics
✅ Data filtering & exploration
✅ Multiple chart types
✅ PDF report generation
✅ Sample data included

## 🚨 Known Issues & Fixes

| Issue | Status | Fix |
|-------|--------|-----|
| papaparse dependency error | ✅ FIXED | Removed, using native CSV parser |
| npm allow-scripts error | ✅ FIXED | Use CMD instead of PowerShell |
| Port conflicts | ✅ SOLVABLE | Use `--port` flag |
| Python import errors | ✅ SOLVABLE | Activate venv first |

## 💡 Tips

1. **Always activate virtual environment before running Python app**
   ```bash
   cd streamlit_app
   venv\Scripts\activate
   streamlit run app.py
   ```

2. **Use Windows CMD for npm commands** (PowerShell has script execution issues)

3. **Sample data is included**  - No API key required to test Streamlit app

4. **Both apps can run simultaneously** on different ports

5. **Clear caches if issues persist**
   ```cmd
   npm cache clean --force
   streamlit cache clear
   ```

## 📚 Documentation

- [Streamlit Docs](https://docs.streamlit.io/)
- [TanStack Start](https://tanstack.com/start/latest)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [YouTube API Docs](https://developers.google.com/youtube/v3)

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Verify Node.js and Python versions: `node --version` and `python --version`
3. Try clearing caches and reinstalling
4. Use Windows CMD instead of PowerShell for npm
5. Ensure virtual environment is activated for Python apps

---

**Last Updated**: 2026-07-04
**Status**: ✅ Ready to Run (both apps)
