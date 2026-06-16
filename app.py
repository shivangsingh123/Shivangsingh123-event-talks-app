import re
import time
import urllib.request
import xml.etree.ElementTree as ET
import hashlib
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Cache configuration
CACHE_DURATION = 300  # Cache for 5 minutes
cache = {
    "data": None,
    "last_updated": 0
}

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_formatting(text):
    """
    Cleans up redundant spaces or formatting issues from HTML snippets if any.
    """
    if not text:
        return ""
    # Remove leading/trailing newlines/spaces
    text = text.strip()
    return text

def parse_release_notes(xml_data):
    """
    Parses the Atom feed XML and splits content by <h3> headers to extract
    individual updates with dates, categories, and HTML bodies.
    """
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        print(f"XML parsing error: {e}")
        return []

    # Atom Feed Namespace
    namespaces = {"atom": "http://www.w3.org/2005/Atom"}
    
    updates = []
    
    # Iterate over each <entry> in the Atom feed
    for entry in root.findall("atom:entry", namespaces):
        # The entry title represents the date (e.g. "June 15, 2026")
        date_str = entry.find("atom:title", namespaces)
        date_str = date_str.text.strip() if date_str is not None else "Unknown Date"
        
        updated_str = entry.find("atom:updated", namespaces)
        updated_str = updated_str.text.strip() if updated_str is not None else ""
        
        link_elem = entry.find("atom:link", namespaces)
        alternate_link = ""
        if link_elem is not None:
            alternate_link = link_elem.attrib.get("href", "")
            
        content_elem = entry.find("atom:content", namespaces)
        if content_elem is None or not content_elem.text:
            continue
            
        content_html = content_elem.text
        
        # Split HTML content by <h3>Category</h3> tags
        # Using a capturing group so that we retain the categories.
        parts = re.split(r'<h3>(.*?)</h3>', content_html)
        
        # If we successfully split by <h3>, parts will look like:
        # [leading_text, category_1, body_1, category_2, body_2, ...]
        if len(parts) > 1:
            for i in range(1, len(parts), 2):
                category = parts[i].strip()
                body = parts[i+1].strip() if i+1 < len(parts) else ""
                
                # Clean up body HTML
                body = clean_html_formatting(body)
                
                # Generate unique ID using hash of date, category, and body
                hash_input = f"{date_str}-{category}-{body}"
                update_id = hashlib.md5(hash_input.encode("utf-8")).hexdigest()
                
                updates.append({
                    "id": update_id,
                    "date": date_str,
                    "updated": updated_str,
                    "category": category,
                    "body": body,
                    "link": alternate_link
                })
        else:
            # Fallback if no <h3> tags exist in content
            hash_input = f"{date_str}-General-{content_html}"
            update_id = hashlib.md5(hash_input.encode("utf-8")).hexdigest()
            updates.append({
                "id": update_id,
                "date": date_str,
                "updated": updated_str,
                "category": "General",
                "body": clean_html_formatting(content_html),
                "link": alternate_link
            })
            
    return updates

def fetch_feed_data():
    """
    Fetches XML feed data from Google Cloud.
    """
    req = urllib.request.Request(
        FEED_URL,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BQPulseViewer/1.0"}
    )
    # Using urllib.request for zero external dependencies
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.read()

@app.route("/")
def index():
    """Renders the main dashboard page."""
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    """
    Exposes parsed release notes as JSON.
    Supports ?force=true query parameter to bypass cache.
    """
    force_refresh = request.args.get("force", "").lower() == "true"
    current_time = time.time()
    
    # Check if cache is valid and not forced to refresh
    if not force_refresh and cache["data"] is not None and (current_time - cache["last_updated"]) < CACHE_DURATION:
        return jsonify({
            "source": "cache",
            "last_updated": cache["last_updated"],
            "releases": cache["data"]
        })
        
    try:
        xml_data = fetch_feed_data()
        parsed_data = parse_release_notes(xml_data)
        
        # Update cache
        cache["data"] = parsed_data
        cache["last_updated"] = current_time
        
        return jsonify({
            "source": "network",
            "last_updated": current_time,
            "releases": parsed_data
        })
    except Exception as e:
        # Fallback to cache if network call fails
        if cache["data"] is not None:
            return jsonify({
                "source": "cache_fallback",
                "last_updated": cache["last_updated"],
                "releases": cache["data"],
                "error": str(e)
            })
        return jsonify({
            "error": f"Failed to fetch and parse feed: {str(e)}"
        }), 500

if __name__ == "__main__":
    # Run server locally on port 5000
    app.run(debug=True, port=5000)
