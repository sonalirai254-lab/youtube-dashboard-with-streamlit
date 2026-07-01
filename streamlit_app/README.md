# YouTube Analytics Dashboard — Crixsoft

A premium, production-ready YouTube analytics dashboard built with **Streamlit + Plotly**. Analyze any channel via the YouTube Data API v3, or explore the bundled sample dataset.

![Dashboard screenshot placeholder](images/screenshot.png)

## Features

- KPI cards: subscribers, total views, video count, average views/likes, engagement rate
- Channel Analysis: banner, logo, description, country, creation date, upload frequency
- Video Analysis: top viewed / liked / commented / recent / highest engagement
- Interactive charts: bar, line, pie, area, scatter, histogram, treemap, heatmap, upload trend
- Filters: date range, title search, category, min views / likes
- Auto-generated insights & growth recommendations
- Export CSV, download charts (PNG), and generate PDF report
- Dark / light mode, glassmorphism cards, gradient theme, sidebar nav, mobile-friendly

## Quick start

```bash
git clone <your-repo-url>
cd youtube_dashboard
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

Open http://localhost:8501.

## Using the YouTube Data API v3

1. Create a project at https://console.cloud.google.com
2. Enable **YouTube Data API v3**
3. Create an **API key**
4. In the sidebar, paste your key and enter a channel handle or ID

No key? The app falls back to `data/sample_videos.csv` and `data/sample_channel.csv`.

## Project structure

```
youtube_dashboard/
├── app.py                   # Streamlit entry point
├── requirements.txt
├── README.md
├── LICENSE
├── .gitignore
├── data/                    # Sample datasets
├── assets/                  # CSS, logos
├── utils/                   # Reusable modules
│   ├── youtube_api.py
│   ├── data_loader.py
│   ├── charts.py
│   ├── insights.py
│   └── report.py
├── images/                  # Screenshots
└── notebooks/               # Exploratory notebooks
```

## Deploy

- **Streamlit Community Cloud** — push to GitHub, connect the repo, set `YOUTUBE_API_KEY` as a secret.
- **Docker** — `docker build -t yt-dashboard . && docker run -p 8501:8501 yt-dashboard`

## License

MIT — see `LICENSE`.