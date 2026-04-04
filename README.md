# DepthIQ

A real-time multiplayer student reasoning evaluator powered by the Claude API.
Concept: Two students answer a live question. Claude evaluates reasoning depth, clarity, correctness, and named misconceptions side-by-side.

## Module Architecture & Workflow

This project is separated into 3 parallel modules for 3 developers.

### 1. Frontend UI (Developer 1) -> `/src/components`
Handles layout, animations, components, tabs (Reasoning Challenge, Exam Prep, Results History).
**Rules:** The UI MUST NOT call the Claude APIs directly. All connections go through `/src/services/api.ts`.

### 2. Claude API Service Layer (Developer 2) -> `/src/services`
Houses all Claude interactions, prompt handling, and output structuring.
**Rules:** `claudeService.ts` exports strictly typed json outputs. It uses constants from `prompts.ts`.

### 3. Session & State (Developer 3) -> `/src/store`, `/src/hooks`, `/src/services/sessionService.ts`
Manages distributed state using Zustand, coordinates Real-Time DB sync (Supabase/Firebase).
**Rules:** `useSession.ts` syncs player states. `useScoring.ts` intercepts both players' answer submittals and triggers the `claudeService`.

## Data Flow Pipeline
1. UI components accept answer input (Frontend UI).
2. The UI pushes the input to `useSession` hook which sets it in the DB (Session & State).
3. The Real-time listener in `useSession` updates global Zustand `store.ts`.
4. The `useScoring` hook sees both answers exist in the `store.ts` mapping and automatically invokes `api.claude.scoreAnswers()` (Claude API).
5. Responses flow back from the API service layer into `store.ts`'s result mapping.
6. Frontend UI re-renders with animated reveal cards.
