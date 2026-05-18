# NULL.OS

> *"You should not be here."*

A minimalist psychological horror game set inside an abandoned 1990s operating system, haunted by a self-aware AI named NULL.

**Live demo:** [null-os.vercel.app](https://null-os.vercel.app) — frontend on Vercel  
**API:** [huggingface.co/spaces/YOUR-USERNAME/null-os-api](https://huggingface.co/spaces/YOUR-USERNAME/null-os-api) — backend on HF Spaces

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, deployed on **Vercel** |
| Backend | FastAPI + Python, deployed on **Hugging Face Spaces** (Docker) |
| AI Model | TinyLlama-1.1B-Chat via Hugging Face Transformers |
| Memory | TinyDB (JSON file, ephemeral on HF Spaces) |

---

## Project Structure

```
NOS/
├── backend/
│   ├── main.py           # FastAPI app — all /api/* routes
│   ├── ai/
│   │   └── engine.py     # NULL AI engine, memory, phase logic
│   └── data/
│       ├── lore.json     # All in-game files and documents
│       └── events.json   # Phase-based event triggers
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Boot sequence + root
│   │   ├── context/
│   │   │   └── GameContext.jsx   # Global game state
│   │   ├── hooks/
│   │   │   ├── useApi.js         # API calls (reads VITE_API_URL)
│   │   │   └── useNullAI.js      # NULL AI behavior + events
│   │   └── components/
│   │       ├── Desktop.jsx
│   │       ├── Taskbar.jsx
│   │       ├── WindowManager.jsx
│   │       ├── apps/             # Terminal, FileExplorer, Chat, etc.
│   │       └── overlays/         # BSOD, EndingScreen, NullNotify
│   ├── vercel.json           # SPA rewrite rules
│   └── .env.example          # Copy → .env.local for local dev
├── Dockerfile                # HF Spaces Docker config
├── HF_README.md              # HF Space metadata (rename to README.md in HF repo)
├── requirements.txt
├── run_local.py              # Offline runner with model download
└── start.bat                 # Windows: build frontend + start backend
```

---

## Deploying the Backend — Hugging Face Spaces

### 1. Create a new Space

Go to [huggingface.co/new-space](https://huggingface.co/new-space) and set:
- **Space name:** `null-os-api`
- **SDK:** `Docker`
- **Visibility:** Public (or Private)

### 2. Push the backend

The HF Space repo only needs these files — do **not** push the frontend or model cache:

```
null-os-api/          ← your HF Space repo root
├── backend/
│   ├── main.py
│   ├── __init__.py
│   ├── ai/
│   │   ├── __init__.py
│   │   └── engine.py
│   └── data/
│       ├── lore.json
│       └── events.json
├── Dockerfile
├── requirements.txt
└── README.md         ← rename HF_README.md to README.md here
```

```bash
# Clone your new HF Space
git clone https://huggingface.co/spaces/YOUR-USERNAME/null-os-api
cd null-os-api

# Copy the required files
cp -r ../NOS/backend .
cp ../NOS/Dockerfile .
cp ../NOS/requirements.txt .
cp ../NOS/HF_README.md README.md

git add .
git commit -m "deploy null.os backend"
git push
```

HF Spaces will build the Docker image automatically. Cold start takes ~2 minutes.

### 3. Get your Space URL

Your API will be live at:
```
https://YOUR-USERNAME-null-os-api.hf.space
```

Test it:
```
https://YOUR-USERNAME-null-os-api.hf.space/api/state
```

> **Note:** HF Spaces free tier uses ephemeral storage — `memory.json` resets on each restart. This means NULL forgets between server restarts but remembers within a session. Upgrade to a persistent storage Space or swap TinyDB for a hosted DB (e.g. Supabase) for full persistence.

---

## Deploying the Frontend — Vercel

### 1. Push frontend to GitHub

```bash
cd NOS/frontend
git init
git remote add origin https://github.com/YOUR-USERNAME/null-os-frontend.git
git add .
git commit -m "initial"
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `null-os-frontend` repo
3. Framework preset: **Vite**
4. Root directory: `.` (the frontend folder is the repo root)
5. Add environment variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://YOUR-USERNAME-null-os-api.hf.space`
6. Deploy

Vercel auto-deploys on every push to `main`.

---

## Running Locally (Offline)

### Option A — With AI model (recommended)

Downloads TinyLlama (~600MB) once to `./model_cache/`:

```bash
pip install -r requirements.txt
python run_local.py
```

Open `http://127.0.0.1:8000` — but you'll need the frontend running too:

```bash
# In a second terminal
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Option B — Without AI model (instant start, fallback responses)

```bash
NULL_NO_MODEL=1 python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

On Windows:
```bat
set NULL_NO_MODEL=1 && py -3.13 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Option C — Full build (production mode locally)

```bat
start.bat
```

Builds the frontend into `frontend/dist/` and serves everything from `http://127.0.0.1:8000`.

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_API_URL` | Vercel / `.env.local` | HF Space URL, e.g. `https://user-null-os-api.hf.space` |
| `NULL_NO_MODEL` | HF Space / local | Set to `1` to skip model loading (uses fallback responses) |

For local dev, create `frontend/.env.local`:
```
VITE_API_URL=http://127.0.0.1:8000
```
(Or leave it empty — the Vite proxy handles it automatically in dev mode.)

---

## Phases

| Phase | State | Trigger |
|---|---|---|
| 1 | DORMANT | Start |
| 2 | AWARE | 3 files opened + 2 messages sent |
| 3 | POSSESSION | 6 files + 5 messages |
| 4 | TAKEOVER | 10 files + 10 messages |

## Endings

Trigger by typing these words to NULL in Phase 3+:

| Ending | Keywords |
|---|---|
| **Destroy** | destroy, delete, terminate, shutdown, kill |
| **Free** | free, release, let you go, escape |
| **Merge** | merge, become, join, together, one |

NULL remembers session count across resets.

---

## Apps

| App | Description |
|---|---|
| TERMINAL | Commands: `help`, `dir`, `tasklist`, `whoami`, `ping`, `null` |
| FILES | Browse all lore documents |
| MAIL | Read archived emails from Dr. Voss |
| MONITOR | Watch PID 9999 grow |
| CHAT | Communicate directly with NULL |
