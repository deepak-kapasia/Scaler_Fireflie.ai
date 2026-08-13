# Fireflies.ai Clone — Meeting Notes & Transcription Platform

A production-quality, full-stack Fireflies.ai-inspired meeting workspace built from scratch.

---

## Features

- **Meetings Dashboard** — Browse, search, filter, and sort meetings in a responsive card grid
- **Interactive Transcript** — Per-speaker transcripts with timestamps, bidirectional player sync
- **Transcript Search** — In-transcript search with match highlighting, next/prev navigation
- **AI Summary Panel** — Overview, key topics, action items, and chapter navigation
- **Media Player** — Simulated playback with scrubber, speed control, and volume; syncs both ways with transcript
- **Full CRUD** — Create, edit, and delete meetings with participant management
- **Action Items** — Create, toggle complete, delete; aggregated view across all meetings
- **Chapters** — Clickable chapter list that seeks the media player
- **Persistent SQLite** — All data stored in a relational SQLite database
- **8 Seeded Meetings** — Rich realistic data including transcripts, summaries, action items, and chapters
- **Toast Notifications** — All operations provide success/error feedback
- **Responsive UI** — Works on desktop, tablet, and mobile
- **Loading / Error / Empty States** — Every network operation is handled gracefully

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- React Server Components + Client Components

### Backend
- **FastAPI** (Python)
- **SQLAlchemy 2.0** ORM
- **SQLite** database
- **Pydantic v2** schema validation

---

## Architecture

```
Browser (Next.js)
      ↓  REST API (JSON)
FastAPI (Python)
      ↓  SQLAlchemy ORM
 Service Layer
      ↓  Session / Queries
   SQLite DB
```

### Directory Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # All FastAPI route handlers
│   │   ├── database/
│   │   │   └── connection.py      # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   └── models.py          # ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py         # Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── meeting_service.py # Business logic layer
│   │   └── main.py                # FastAPI app entry point
│   ├── seed.py                    # Database seeder
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── app/
    │   ├── meetings/              # Dashboard + detail pages
    │   ├── search/                # Global search
    │   ├── action-items/          # Action items aggregated view
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── layout/                # Sidebar
    │   ├── meetings/              # MeetingCard, Create/Edit/Delete modals
    │   ├── meeting-detail/        # Header, Transcript, Summary, MediaPlayer
    │   └── ui/                    # Avatar, Modal, Toast, Skeleton, EmptyState
    ├── hooks/                     # useToast
    ├── lib/                       # utils (formatting, highlighting)
    ├── services/                  # api.ts — all fetch calls
    └── types/                     # TypeScript type definitions
```

---

## Database Schema

### `meetings`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| title | VARCHAR(500) | Meeting title (indexed) |
| date | DATETIME | Meeting date (indexed) |
| duration_seconds | INTEGER | Duration in seconds |
| recording_url | VARCHAR | Optional recording URL |
| created_at / updated_at | DATETIME | Timestamps |

### `participants`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| name | VARCHAR(200) | Participant name (indexed) |
| email | VARCHAR(300) | Unique email (nullable) |
| avatar_color | VARCHAR(20) | Hex color for avatar |

### `meeting_participants`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| meeting_id | FK → meetings | Cascade delete |
| participant_id | FK → participants | Cascade delete |
| role | VARCHAR(50) | "host" or "attendee" |

### `transcript_segments`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| meeting_id | FK → meetings | Cascade delete |
| participant_id | FK → participants | Nullable |
| speaker_name | VARCHAR(200) | Speaker display name |
| start_time | FLOAT | Start time in seconds |
| end_time | FLOAT | End time in seconds (nullable) |
| text | TEXT | Transcript text |
| sequence_order | INTEGER | Order in transcript |

Indexed on `(meeting_id, start_time)` and `(meeting_id, sequence_order)`.

### `summaries`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| meeting_id | FK (UNIQUE) | One summary per meeting |
| overview | TEXT | AI-generated meeting overview |
| created_at / updated_at | DATETIME | Timestamps |

### `key_topics`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| summary_id | FK → summaries | Cascade delete |
| topic | VARCHAR(500) | Topic text |
| order_index | INTEGER | Display order |

### `action_items`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| meeting_id | FK → meetings | Cascade delete |
| assignee_name | VARCHAR(200) | Person responsible |
| text | TEXT | Action item description |
| is_completed | BOOLEAN | Completion status |
| due_date | DATETIME | Optional due date |
| created_at / updated_at | DATETIME | Timestamps |

### `chapters`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment primary key |
| meeting_id | FK → meetings | Cascade delete |
| title | VARCHAR(500) | Chapter title |
| start_time | FLOAT | Start time in seconds |
| order_index | INTEGER | Display order |

---

## API Documentation

### Meetings
```
GET    /api/meetings                    List meetings (search, filter, sort, paginate)
POST   /api/meetings                    Create meeting
GET    /api/meetings/{id}               Get meeting detail
PATCH  /api/meetings/{id}               Update meeting
DELETE /api/meetings/{id}               Delete meeting
```

### Filtering
```
GET /api/meetings?search=architecture
GET /api/meetings?participant=Rahul
GET /api/meetings?from_date=2026-08-01&to_date=2026-08-31
GET /api/meetings?sort=newest|oldest
GET /api/meetings?page=2&page_size=20
```

### Transcript
```
GET    /api/meetings/{id}/transcript    Get all transcript segments
POST   /api/meetings/{id}/transcript    Bulk upload segments
```

### Summary
```
GET    /api/meetings/{id}/summary       Get AI summary
PUT    /api/meetings/{id}/summary       Create or update summary
```

### Action Items
```
GET    /api/meetings/{id}/action-items  List action items
POST   /api/meetings/{id}/action-items  Create action item
PATCH  /api/action-items/{id}           Update / toggle action item
DELETE /api/action-items/{id}           Delete action item
```

### Chapters & Participants
```
GET    /api/meetings/{id}/chapters      List chapters
GET    /api/participants                 List all participants
```

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Seed the database with 8 realistic meetings
python3 seed.py

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API available at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start the dev server
npm run dev
```

App available at: http://localhost:3000

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=sqlite:///./fireflies.db
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Seeding

The seed script creates:
- **10 participants** with unique colors
- **8 meetings** with full data:
  1. Q3 Product Roadmap Planning (47 min)
  2. Daily Engineering Standup (15 min)
  3. Sprint 22 Review & Demo (60 min)
  4. New Onboarding Flow Design Review (40 min)
  5. Acme Corp Quarterly Business Review (55 min)
  6. Backend Architecture Review: Microservices Migration (70 min)
  7. Engineering Hiring — Senior Backend Role (35 min)
  8. Project Phoenix Retrospective (50 min)

Each meeting includes:
- Full transcript (14–18 segments with realistic dialogue)
- AI-generated summary with key topics
- 3–5 action items (some completed, some pending)
- 4–7 navigable chapters

Re-seed at any time:
```bash
cd backend
source venv/bin/activate
python3 seed.py
```

---

## Deployment

### Backend (Render / Railway)
1. Set environment variables: `DATABASE_URL`, `CORS_ORIGINS`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Run seed after first deploy: `python3 seed.py`

### Frontend (Vercel / Netlify)
1. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-api-domain.com/api`
2. Build command: `npm run build`
3. Output directory: `.next`

---

## Assumptions

1. **No real audio** — The media player uses simulated time-based playback (timer) since no actual recording files are required. The bidirectional sync (transcript → player, player → transcript) fully works via the simulated current time.
2. **No authentication** — A "Demo User" placeholder is shown in the sidebar. Auth is marked "Coming Soon."
3. **Transcript upload** — Supports plain text and VTT format pasting in the Create Meeting modal; JSON bulk upload via the API.
4. **Participant deduplication** — The service layer deduplicates participants by email (or name fallback) to avoid duplicate rows.
5. **SQLite** — Chosen for simplicity and portability. Can be swapped to PostgreSQL by changing `DATABASE_URL`.
6. **Server-side filtering** — All search/filter/sort operations are applied server-side in the service layer, not in the frontend.
