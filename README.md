# BQ Pulse - BigQuery Release Notes Dashboard

BQ Pulse is a premium, responsive web application that aggregates, formats, and displays Google BigQuery Release Notes. It allows you to search and filter updates, preview posts on X (formerly Twitter) in a realistic UI mockup, and publish them instantly using official Twitter Web Intents.

## ✨ Features

- **⚡ Real-Time Splitting & Parsing**: Parses the official Atom feed and splits day-by-day updates into individual category cards (`Feature`, `Change`, `Deprecation`, or `General`).
- **🔄 Smart Caching & Force Refresh**: Automatically caches the parsed release notes for 5 minutes. Bypassing the cache for a live update is as simple as clicking the **Refresh** button with its dynamic spinner.
- **🔍 Filter and Search**: Instant search indexing on dates, tags, and body content with category selector chips and sorting.
- **🐦 Built-In X Composer**: Pick any release note to customize, add quick hashtag suggestions, monitor character limits (280 characters warning), and view a pixel-perfect mockup preview of how it will look on X.
- **📱 Responsive Layout**: Fully responsive glassmorphic layout optimized for both desktop and mobile viewports.

---

## 🛠️ Project Structure

```text
bigquery-feed-app/
├── app.py                  # Flask Web Server, XML Fetcher & Parser
├── requirements.txt        # Python dependencies
├── .gitignore              # Files ignored by git
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Main Dashboard and Modal Layout
└── static/
    ├── css/
    │   └── style.css       # Custom Glassmorphic CSS Styling
    └── js/
        └── main.js         # Frontend controller for events & APIs
```

---

## 🚀 Getting Started

Follow these instructions to run the application locally.

### Prerequisites

Ensure you have **Python 3.10+** installed on your system.

### Setup and Running

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Shivangsingh123/Shivangsingh123-event-talks-app.git
   cd Shivangsingh123-event-talks-app
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment**:
   - **On Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **On macOS/Linux (Bash/zsh)**:
     ```bash
     source .venv/bin/activate
     ```

4. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the Flask application**:
   ```bash
   python app.py
   ```

6. Open your browser and navigate to:
   **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔒 License

This project is licensed under the MIT License - see the LICENSE file for details.
