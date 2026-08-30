"""The ASGI entrypoint Vercel imports.

Vercel's FastAPI runtime looks for a module-level instance named `app`. Everything else
here builds through `create_app()` and deliberately has none: a module-level application
constructs itself — and validates Settings — at import time, which the test suite would
trigger on every run (decision 007). This module is the one place that trade is made, and
nothing but the deployed process imports it.
"""

from app.main import create_app

app = create_app()
