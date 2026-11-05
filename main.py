from pathlib import Path

import uvicorn
from dotenv import load_dotenv

from app.web import create_app


def main():
    project_folder = Path(__file__).resolve().parent
    load_dotenv(project_folder / ".env")
    application = create_app(project_folder)
    uvicorn.run(application, host="127.0.0.1", port=8766)


if __name__ == "__main__":
    main()
