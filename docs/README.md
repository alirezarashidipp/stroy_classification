# HSBC Work Item Classifier

Small local demo: enter a work item and receive a Story, Task, or Bug assessment with evidence and a rubric match gauge. English interface; input may be in other languages.

## Run

From the project folder, run `.\.venv\Scripts\python.exe main.py` and open <http://127.0.0.1:8766>.

For a fresh environment: `py -3.12 -m venv .venv`, then `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`. Copy `.env.example` to `.env` only if `.env` does not already exist, then set `OPENAI_API_KEY` and `OPENAI_MODEL`. Existing environment variables take precedence. Restart after changing settings. The existing `.env` is preserved.

## Files and flow

- `main.py`: read environment → create application → start local server.
- `app/web.py`: page, static files, and API routes with safe provider errors.
- `app/classification.py`: clean text → request assessment → calculate result.
- `app/rubric.py`: criteria and structured output schema.
- `frontend/`: standalone HTML, CSS, and browser JavaScript.
- `static/image/`: existing HSBC logo.

## Rubric v1.0

Proposed demo rubric, **not an official HSBC policy**. Each category has three equally weighted criteria. See `app/rubric.py` or the on-page rubric for definitions.

Each criterion scores 0 (absent), 1 (implied / incomplete), or 2 (explicit / clear). Nonzero scores must cite a verbatim substring of the cleaned input. The server verifies the quotes and calculates each category's match as `round(sum(scores) / 6 * 100)`. Category scores are independent; they do not sum to 100. The gauge shows rubric match, **not calibrated confidence or accuracy**.

The highest category wins. A tie or zero evidence produces `Needs review`. Review is also flagged for model-detected ambiguity, a best score below 67, or a margin below 17 points. These thresholds are demo heuristics. Missing acceptance criteria alone must not turn a Story into a Task. Existing malfunctions remain Bugs even when expressed as user stories.

## OpenAI

One server-side Responses API request per analysis, using the model selected in `.env`, structured JSON output, a 50-second provider timeout, and no automatic retries. Keys and provider error bodies are never returned to the browser. The app does not save work items or results. Entered text is sent to OpenAI; `store=False` is used for the response. This does not claim zero provider retention.

API reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Scope

Local demonstration bound to `127.0.0.1`. No authentication, database, Jira integration, training, or production deployment. Sample buttons fill editable text; they do not fabricate results. Human-labelled evaluation and confidence calibration have not been performed.
