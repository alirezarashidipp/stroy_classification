# Work Item Classifier — implementation plan

Build the agreed single-page classifier as a local Python demo. Reuse installed FastAPI, OpenAI, dotenv, the existing environment, and HSBC logo. Keep the browser buildless and the main flow explicit. Do not add test files.

1. Add `main.py`, `app/web.py`, `app/classification.py`, and `app/rubric.py`: load settings, serve the frontend, assess nine criteria, verify quotes, calculate matches, and flag ambiguity.
2. Add `frontend/index.html`, `frontend/styles.css`, and `frontend/app.js`: input, example text, loading/error/empty/result states, gauge, category scores, evidence, and expandable rubric.
3. Add setup and rubric documentation under `docs` and dependency/secret ignore files at the root.
4. Verify with small inline Python checks for validation, scoring, quotes, and API routing; check browser interactions and responsive widths. Attempt a live synthetic analysis and state its actual outcome.
