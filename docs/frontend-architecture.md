# Frontend architecture — React Query + Zustand

**Stack:** React 19 · Vite · TypeScript · TanStack Query · Zustand · axios  
**Backend:** Spring Boot `http://localhost:8080` (proxy `/api` in dev)

---

## One picture (DuyLong four layers)

```text
┌─────────────────────────────────────────────────────────────────┐
│  SENSOR — React components (pages, GlassCard, MocaTestContainer) │
├─────────────────────────────────────────────────────────────────┤
│  ORCHESTRATION — useQuery / useMutation hooks + Zustand UI store │
├─────────────────────────────────────────────────────────────────┤
│  LINK — *.api.ts (axios) + shared/types + queryKeys              │
├─────────────────────────────────────────────────────────────────┤
│  DATA — PostgreSQL via Spring (users, test_sessions, …)          │
└─────────────────────────────────────────────────────────────────┘
         ▲ JWT from authStore (Zustand persist)
```

---

## Responsibility split

| Tool | Owns | Does NOT own |
|------|------|----------------|
| **axios** (`shared/lib/axios.ts`) | HTTP, `Authorization` header | Cache, business rules |
| **React Query** (`features/*/use*Queries.ts`) | Server rows, loading/error, invalidate | Modal open, filter UI |
| **Zustand** (`stores/`) | Auth session, UI flags | Copy of API lists |
| **Components** | Render + user events | Direct `axios.get` in JSX |

**Rule:** Data that must match DB after refresh → **Query**. Ephemeral UI → **Zustand**.

---

## Folder map

```text
frontend/src/
├── shared/
│   ├── lib/
│   │   ├── axios.ts           # Link — HTTP client
│   │   ├── queryClient.ts     # Query defaults
│   │   └── queryKeys.ts       # Cache key factory
│   ├── types/                 # DTOs (mirror API JSON)
│   ├── api/health.api.ts      # Cross-cutting API
│   ├── hooks/useHealth.ts
│   └── components/            # AppShell, GlassCard, …
├── stores/
│   ├── authStore.ts           # user + token (persist)
│   └── uiStore.ts             # filters, toggles (no persist)
├── features/
│   ├── patient/
│   │   ├── patient.api.ts     # Link
│   │   ├── usePatientQueries.ts
│   │   └── *Page.tsx          # Sensor
│   ├── doctor/
│   │   ├── doctor.api.ts
│   │   └── useDoctorQueries.ts
│   └── admin/
│       ├── admin.api.ts
│       └── useAdminQueries.ts
├── router.tsx
└── App.tsx                    # QueryClientProvider
```

---

## Query key convention

```typescript
['patient', patientId, 'sessions']     // list
['patient', patientId, 'sessions', id] // detail
['doctor', doctorId, 'reviews']        // pending queue
['admin', 'stats']                     // dashboard
['health']                             // API up?
```

Include **scope ids** (`patientId`, `doctorId`) so cache never leaks between users.

---

## Read path (E2)

```text
PatientResultsPage
  → usePatientSessions()           // Orchestration
    → queryKey: patient.sessions(id)
    → patientApi.listSessions(id)  // Link
      → GET /api/v1/patient/{id}/sessions
        → test_sessions SQL
  → useUiStore(s => resultsFilter) // Zustand — client filter only
  → map rows → GlassCard
```

---

## Write path (E3) — when submit MoCA

```text
MocaTestContainer onComplete
  → useSubmitSession().mutate(payload)
    → POST /api/v1/test-sessions
    → onSuccess: invalidateQueries(patient.sessions)
  → navigate /patient/results
```

---

## Zustand stores

| Store | Persist? | Contents |
|-------|----------|----------|
| `authStore` | yes | `user`, `token`, `loginDev`, `logout` |
| `uiStore` | no | `patientResultsFilter`, `doctorAiAssist` |

**Anti-pattern:** `sessions[]` in Zustand populated from `useEffect` — use Query instead.

---

## Mock vs live API

`.env`:

```bash
VITE_API_URL=          # empty = use Vite proxy /api
VITE_USE_MOCK=true     # false when Spring endpoints exist
```

`*.api.ts` returns mock data when `VITE_USE_MOCK=true` (default until backend wired).

---

## Implementation slices (order)

1. ✅ Architecture + queryKeys + api modules + hooks scaffold
2. `POST /api/v1/test-sessions` + `useSubmitSession`
3. Replace mocks on patient/doctor/admin lists
4. JWT login replaces `loginDev`

---

## Learn log

- 2026-06-24 — Query = server truth; Zustand = auth + UI chrome only.
