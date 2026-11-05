import os
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import APIConnectionError, APIStatusError, APITimeoutError, AuthenticationError, RateLimitError

from app.classification import classify_text
from app.rubric import RUBRIC, RUBRIC_VERSION


def create_app(project_folder: Path):
    application = FastAPI(title="HSBC Work Item Classifier", docs_url=None, redoc_url=None)
    frontend_folder = project_folder / "frontend"
    application.mount("/frontend", StaticFiles(directory=frontend_folder), name="frontend")
    application.mount("/static", StaticFiles(directory=project_folder / "static"), name="static")

    @application.get("/")
    def home():
        return FileResponse(frontend_folder / "index.html")

    @application.get("/api/status")
    def status():
        return {"configured": bool(os.getenv("OPENAI_API_KEY", "").strip())}

    @application.get("/api/rubric")
    def rubric():
        return {"version": RUBRIC_VERSION, "categories": RUBRIC}

    @application.post("/api/classify")
    def classify(payload: dict = Body(...)):
        try:
            return classify_text(payload.get("text"))
        except ValueError as error:
            raise HTTPException(422, str(error)) from None
        except AuthenticationError:
            raise HTTPException(502, "OpenAI rejected the API key. Check OPENAI_API_KEY in .env.") from None
        except RateLimitError:
            raise HTTPException(503, "OpenAI quota or rate limit reached. Check API billing or try again later.") from None
        except (APITimeoutError, APIConnectionError):
            raise HTTPException(503, "Could not reach OpenAI in time. Check your connection and try again.") from None
        except APIStatusError:
            raise HTTPException(502, "OpenAI could not process the request. Check OPENAI_MODEL and account access.") from None
        except RuntimeError as error:
            raise HTTPException(502, str(error)) from None
        except (KeyError, TypeError):
            raise HTTPException(502, "The model returned an incomplete assessment. Please try again.") from None

    return application
