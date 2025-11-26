# Search — Code / Study (Frontend)

This is a small single-page frontend for searching and importing code snippets or study notes. It also includes an optional emotion-detection integration that captures a webcam frame periodically and sends it to a backend `/predict` endpoint for inference.

This README explains what the project contains and how to run it locally and link a simple backend for emotion detection before pushing to GitHub.

---

## What this repository contains

- `index.html` — Single-page app markup. Includes the import area, search UI, results list, and a small emotion-detection UI (hidden video + visible status box).
- `style.css` — Styling for the layout, panels and the toast/loader UI.
- `main.js` — Frontend logic: search mock, import-as-result-card, sidebar collapse/expand, and the added emotion detection integration.

## Emotion detection feature

- The frontend will request camera access and capture a frame periodically (default every 3000 ms) and POST it to a backend endpoint which should live at `http://localhost:5000/predict` by default.
- The frontend starts the emotion detection after the user's first interaction (click) to satisfy browser autoplay and permission requirements.
- The backend should receive a `multipart/form-data` POST with field name `frame` containing an image (JPEG). The backend must respond with JSON in the format:

```json
{ "emotion": "happy", "confidence": 0.87 }
```

- The returned `emotion` and `confidence` will be displayed in the page's `#emotion-box` and (optionally) trigger a desktop notification if the user granted permission.

### Example minimal backend (Flask, Python)

This is an example skeleton you can use locally for testing. It does not perform real inference — replace it with your model code.

```py
# sample_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    # The uploaded file will be available at request.files['frame']
    f = request.files.get('frame')
    if f is None:
        return jsonify({'error': 'no frame provided'}), 400
    # TODO: run model inference on the bytes f.read()
    # Dummy response:
    return jsonify({'emotion': 'neutral', 'confidence': 0.63})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

Run:

```bash
python -m pip install flask flask-cors
python sample_server.py
```

Make sure the backend allows CORS from your frontend origin (the example uses `flask_cors.CORS` which allows all origins by default).

## Running the frontend locally

You can serve the static files with a simple HTTP server while developing.

Python 3 built-in server (serve from project root):

```bash
# Powershell on Windows
python -m http.server 8000; Start-Process "http://127.0.0.1:8000/index.html"
```

Or with Node (if you prefer):

```bash
# install http-server globally once
npm install -g http-server
http-server -c-1 .
```

Open the app in your browser (e.g. `http://127.0.0.1:8000/`).

## Configuring the backend endpoint

The frontend defaults to `http://localhost:5000/predict`. If your backend runs elsewhere, update the `DEFAULT_EMOTION_API` variable in `main.js` to point at the correct URL or proxy `/predict` to your backend.

## Privacy & security

- Camera frames are sensitive. The app captures frames and uploads them to the configured backend endpoint. Only enable this feature if you trust the backend and have user consent.
- Ensure the server uses HTTPS in production and that you have a clear privacy policy for storage/processing of camera frames.

## What to push to GitHub

Push the repository as-is. Before publishing a public repo, consider removing any hard-coded local backend URLs or adding a configuration mechanism. Add a `LICENSE` file if needed.

## Troubleshooting

- If camera access is denied: check browser permission settings and that the page is served via `http`/`https` from a reliable origin (file:// sometimes blocks camera permissions).
- If the backend returns CORS errors: ensure CORS is enabled on the backend (see Flask example above).
- If no emotion updates appear: open DevTools console to see any fetch errors or permission warnings.

---

If you want, I can also:
- Add a small UI toggle to enable/disable emotion detection (recommended for privacy).
- Add a configuration UI to change the backend URL from the page.
- Generate a minimal `package.json` or simple build script if you plan to expand this into a more complex app.

Tell me which of these you'd like next, or if you'd like me to commit and open a PR-ready branch message for GitHub.
