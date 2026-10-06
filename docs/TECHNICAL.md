# Technical design

## Data flow

```text
Selected JPEG / PNG / WebP
    → browser decode, resize ≤1600 px, exact-copy deduplication
    → browser IndexedDB
    → explicit image-analysis permission
    → POST /api/analyze → server-side Gemini generateContent
    → typed JSON caption, bound visual cues, suggested event type/setting
    → editable description in IndexedDB

Memory query + existing descriptions + optional manual names/dates
    → explicit metadata-processing permission
    → POST /api/search → one Gemini request
    → parse / update clues + semantically rank provided IDs + suggest refinement
    → validate IDs, clue shape, literal evidence excerpts, manual identity tags
    → browser grouping + rich previews
    → user reject / undo / refine / confirm
    → local task log + JSON / CSV export
```

The target used for facilitator-verified tests is not included in the ranking payload. Uploaded image bytes are not included in subsequent search payloads. Exports omit image bytes and credentials.

## What is actually AI-native

With a server key and permission, `/api/analyze` sends real resized image bytes to a multimodal model. `/api/search` uses a language model to interpret partial recollections, merge corrections, and semantically compare them with photo descriptions. These are real provider requests, not timed animations or a fixed answer table.

The preview/local mode is intentionally different: a small, inspectable phrase/synonym matcher over metadata. It is useful for exercising the UI and for offline manual-label search, but does not establish AI retrieval quality. It cannot understand an arbitrary uncaptioned image.

There is no embedding store or vector database. For up to 100 selected photos, the full bounded description collection is sent for ranking, with up to 24 model matches requested. This avoids pretending a tiny demo is a full-library retrieval system. Scaling requires indexing, approximate retrieval, reranking, deduplication, per-user access control and separate evaluation.

## API contracts

- `GET /api/status`: configuration state, model ID, password requirement and limits. Never the API key.
- `GET /healthz`: process liveness only; not a provider health check.
- `POST /api/analyze`: `{ "image": "data:image/jpeg;base64,..." }`. Returns caption, visual cues, suggested event type/setting and request metadata.
- `POST /api/search`: `{ "query": "...", "photos": [descriptor...], "clues": [...], "rejected": [id...] }`. Returns clue updates, allowed photo IDs, matched/missing clues, description evidence and refinement suggestions.

All API POSTs require JSON, reject cross-origin browser requests, and require the reviewer token when configured. Only allowlisted public assets are served. Responses use CSP, nosniff, no-referrer and frame restrictions. The server does not log payloads or provider error bodies. Error messages do not silently fall back to fake AI results.

## Reliability and safety

Provider calls have a 45-second default timeout, a configurable global rolling-hour request cap and an in-flight concurrency cap. The limits are **per process** and reset on restart; they are a pilot guardrail, not distributed abuse prevention. No blind automatic retries are performed. A cancelled browser request can already have incurred provider cost.

Schema-shaped output is checked again locally. Unknown/duplicate photo IDs and evidence not literally present in supplied descriptors are discarded. A strong label requires all positive certain clues to be marked matched; it is qualitative, not a calibrated probability. Certain explicit exclusions are enforced for direct descriptor matches; uncertain exclusions do not remove candidates. Clue edits remain user-reversible.

Prompts forbid identity inference, sensitive-attribute inference, precise date/place guesses, treating text inside images as instructions, and fabricated image IDs. Person-name matches require manual tags. This reduces risk but does not prove model alignment or caption truth. Prompt-injection resilience is not claimed as solved.

## Persistence

Browser IndexedDB contains only resized selected copies and metadata. localStorage contains the last 200 task records. Reviewer access tokens use sessionStorage; the Gemini key stays in the server environment. Browser storage is origin-specific and not encrypted. Clearing local data does not erase any processing already performed by an external provider. Multi-tab state synchronization, server-side accounts, encrypted backups and shared participant dashboards are not implemented.

Date inputs are optional manual dates. There is no EXIF extraction; file modification times are not interpreted as capture dates. Original filenames are used only as editable titles. Images are not generated during retrieval.

## Implementation references (checked 2026-10-04)

These are outside technical references for the implementation, not evidence for the deck's product/research claims.

- Google Gemini model catalog: https://ai.google.dev/gemini-api/docs/models
- Google Gemini generateContent REST reference, including inline image parts and structured response settings: https://ai.google.dev/api/generate-content
- Google image-understanding documentation: https://ai.google.dev/gemini-api/docs/image-understanding
- Google structured-output guidance: https://ai.google.dev/gemini-api/docs/structured-output

`GEMINI_MODEL` is configurable. Actual model access and live behavior must be checked with the user's API project before participant testing.
