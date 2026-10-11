# MoCA Platform — Backend

PostgreSQL + Spring Boot 3 (Java 21).

## Quick start

```bash
# 1. Postgres only (MinIO runs on another server)
docker compose up -d postgres

# 2. Env — remote Postgres + MinIO (when ready)
cp .env.example .env
# Postgres: DB_HOST=192.168.22.24  DB_NAME=moca-test-db
# pgAdmin: http://192.168.22.24/browser/

# 3. Export env then run
set -a && source .env && set +a
./gradlew bootRun
```

**Postgres (team):** `192.168.22.24`, database `moca-test-db`, pgAdmin at `/browser/`.  
**MinIO:** separate object store for drawing PNGs — bucket `moca-drawings` (not the Postgres DB name).  
**Redis:** `redis.duylong.art:6379` (TLS when `REDIS_SSL=true`). Web UI: https://redis.duylong.art/

Drawing answers (`section_1*_canvas`) upload to `moca-drawings` on submit;
Postgres `raw_answers` stores MinIO object refs, not base64.

Fetch a drawing for doctor review:

`GET /api/v1/test-sessions/{sessionId}/drawings/{answerKey}`

`answerKey`: `section_1a_trail_canvas` | `section_1b_cube_canvas` | `section_1c_clock_canvas`

Health check: `GET http://localhost:8080/api/v1/health`

## Stack

| Layer | Path |
|-------|------|
| Migration (lõi) | `src/main/resources/db/migration/` |
| Entity + DAO | `DataLayer/protocol/` |
| Object storage | `ObjectDb/` — MinIO (Section 1 drawings) |
| AI / Whisper | `AiLayer/` + `Service/ai/` + `Controller/ai/` |
| API | `*Controller.java` |
| Business logic | `*Service.java` (next slice) |

## Env

Copy `.env.example` → `.env` (local only, not committed).

### Whisper (AI ASR for section 5)

| Mode | How to connect |
|------|----------------|
| OpenAI | Set `WHISPER_ENABLED=true`, `WHISPER_PROVIDER=openai`, put key in `WHISPER_API_KEY` |
| Local | `docker compose --profile local-whisper up -d` then `WHISPER_PROVIDER=local`, `WHISPER_BASE_URL=http://localhost:9002` |

Bound in Spring as `whisper.*` → `WhisperProperties` (`AiLayer`). Keep API keys off the frontend.

**API**

```bash
# Config check (no secrets)
curl -s http://localhost:8080/api/v1/ai/whisper/status

# Transcribe audio (multipart field name: file)
curl -s -X POST http://localhost:8080/api/v1/ai/whisper/transcribe \
  -F "file=@sample.webm;type=audio/webm"
```

Flow: `WhisperController` → `WhisperUseCase` → `HttpWhisperClient` (openai `/audio/transcriptions` or local `/asr`).
