# Fast React AR

A React/model-viewer interface with a small FastAPI catalogue and GLB/USDZ upload API.

## Local backend

Use Python 3.12. From the repository root:

```bash
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows: .venv\Scripts\activate
python -m pip install -r backend/requirements-dev.txt
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The backend stores assets in `backend/static/` and metadata in `backend/models_db.json` when started from `backend/`. These runtime files are ignored by Git. Back them up before deploying or moving the application. Run one application worker: the JSON catalogue is not a multi-process database.

## Frontend

Use Node.js 22.12+ (or another version supported by the pinned Vite release):

```bash
cd frontend
npm ci
npm run dev
```

The current frontend and backend model URLs point to the original configured API host. For a wholly local setup, change the API URL constants in `frontend/src/components/{ARPage,ModelsList,ModelUpload}.jsx` and `BASE_URL` in `backend/main.py` to `http://localhost:8000` before running the UI. The backend tests do not contact that host or any model provider.

## Upload boundaries

- Custom identifiers must contain 1–64 ASCII letters, digits, underscores or hyphens. Existing read routes and response fields are unchanged.
- Both files must have the expected extension and signature. This is a preliminary signature check, **not a full GLB/USDZ parser or malware scan**.
- Each file is limited to 25 MiB by default; set `MAX_MODEL_BYTES` to a positive byte count before starting the backend. Reads are bounded and oversized files return HTTP 413 before any model assets are created.
- Uploads cannot overwrite an existing asset or follow a pre-existing target symlink. A collision returns HTTP 409. A duplicate registered identifier continues to return HTTP 400.
- A persistence failure rolls back assets created by that request and returns a generic HTTP 500 response. Metadata is replaced atomically rather than truncated in place.

This demo has no upload authentication or rate limiting. Keep it on a trusted/local network; before public operation put authenticated access, a total request-body limit and a storage quota at the gateway. The per-file check runs after multipart parsing, so it is not a replacement for an upstream request limit. Do not run the development UI or an anonymous upload API as a production service.

## Checks

From the repository root, with the virtual environment active:

```bash
python -m pytest -q backend/tests
python -m ruff check backend
python -m compileall -q backend
```

The regression suite uses temporary directories and synthetic files only. It covers traversal and absolute paths, size limits, existing files/symlinks, rollback, safe error responses and the successful upload/read contract. GitHub Actions runs these checks on Python 3.12.

Runtime dependencies are pinned in `backend/requirements.txt`; their direct inputs are in `backend/requirements.in`. Regenerate deliberately with `uv pip compile --upgrade --python-version 3.12 backend/requirements.in --output-file backend/requirements.txt`, then `uv pip compile --python-version 3.12 backend/requirements-dev.in --output-file backend/requirements-dev.txt`. Both output files include their complete transitive dependency sets. Recreate a clean environment and rerun the suite after upgrades; do not use `uv pip sync` on the uncompiled `.in` files.

## License

See [LICENSE](LICENSE).
