# MemoryTrail — Part 5 MVP

**Find a remembered photo from a few imperfect clues.**

Built from the supplied **Google Photos 100M case study deck.pptx**, specifically the **Event Archivists** segment (parents and families), the birthday / child / red-dress scenario, and the expression → interpretation → evaluation → refinement breakdowns. This is the end-user retrieval MVP, not a reviews-analysis or discovery engine.

## Start in one minute

Requires Node.js 18.20+; Node.js 22 was used for automated testing. There are **no third-party runtime dependencies** and no build step.

```sh
cd memorytrail-part5
npm start
```

Open **http://localhost:3000**. The 12-image sample collection works immediately without an API key, using explicitly labeled local metadata search. Alternatively, open `MemoryTrail_Part5_Preview.html` directly for the self-contained interactive preview. The preview never calls an AI service.

### Turn on real AI

```sh
cp .env.example .env
```

Edit `.env` in a text editor:

```dotenv
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-3.8-flash
```

Restart `npm start`. In **AI settings**, select **Test live AI (1 call)**. The configured-model indicator is deliberately different from a successfully tested connection.

**Do not paste your key into chat, the browser, or a public repository.** `.env` is excluded from Git and the Docker build context. The server loads `.env` itself, so it does not depend on Node's newer `--env-file` flag. Model access, quota and any provider charges belong to your API account. Change `GEMINI_MODEL` to an available multimodal, structured-output model when necessary.

The default model and REST shapes were checked against Google's documentation on 2026-10-04. Availability can vary by account. See `docs/TECHNICAL.md` for primary-source references.

## What to try

### The deck's sample scenario

Enter:

> My child's birthday, wearing a red dress.

The app extracts editable memory clues and shows existing sample images, grouped into fictional events. The birthday child should rank ahead of the child playing with blocks. Open **Why this photo?**, inspect the evidence, reject a wrong result, undo, add **candles**, and select **This is the photo**. Mark a guessed year **Maybe** rather than excluding every other year.

Sample imagery is cropped from the user's slide illustrations. Every sample person tag, date and event grouping is fictional metadata authored for this demo. Sample results do not validate research claims or prove real-world AI retrieval quality.

### Your own photos — the actual AI path

1. Choose **Add photos** and select JPEG, PNG or WebP images. Start with about 10–20 from a few occasions.
2. An event label and date are optional. Names are manual tags only; batch names apply to every selected image, so enter them only when correct for all.
3. Check **Describe these images with Gemini** to consent to image processing. Each photo is resized and sent to the server/provider once for a structured description.
4. Switch to **My photos**, describe your memory and consent to sending the query and metadata for semantic ranking.
5. Review descriptions and correct mistakes in a photo's **Edit the photo's context** section. Confirm or reject results.

Without a key, your own images still import. Add captions and labels manually to search them locally. An uncaptioned image cannot be semantically searched by the local matcher. Failed AI descriptions stay unindexed and can be retried with **Describe unindexed photos with AI**.

Supported limit: 100 selected photos per browser, JPEG/PNG/WebP up to 20 MB before resizing, with copies capped at 1,600 pixels on the longest edge. HEIC and videos are not implemented. Originals are not uploaded intact; the saved image is the resized copy.

## Included features

| Deck problem | Implemented interaction |
|---|---|
| Cannot express remembered fragments | Natural-language memory input, optional browser voice input, editable certain / maybe clues |
| Literal matching misses semantic context | Gemini visual descriptions plus semantic ranking over those descriptions; local phrase matching is explicitly a separate fallback |
| Results are overwhelming | Moment grouping, matched/missing cues, evidence excerpts and full-image previews |
| Cannot refine a failed search | Suggested clues, follow-up input, ignored/restored clues, reject/undo and a replayable search trail |
| Need to measure success | Confirmations, elapsed time, explicit abandonment, refinement rounds, target-verified tasks and JSON/CSV exports |

## Test with participants

Use **Run a retrieval test**. A facilitator selects the intended target and an anonymous participant code *before* the first query. Hand the screen to the participant. The timer begins on the first search; the ground-truth target is **not sent to Gemini or used in ranking**.

A user confirmation without a preselected target is **self-reported**, not verified success. The app keeps sample runs, uploaded-photo runs, abandoned tasks and interrupted tasks distinguishable. All metrics start empty; no participant outcomes are prefilled.

See `docs/USER_TESTING.md` for the test script and metric denominators. Engineering smoke tests are not user research.

## Public hosting

The app is **not publicly deployed by this package**. Deployment needs a Node/Docker host, HTTPS, a server API key and a reviewer password. A static HTML host serves only the non-AI preview.

See `docs/DEPLOYMENT.md`. The included Dockerfile is a deployment recipe, not a verified cloud deployment. A non-loopback, key-enabled server refuses to start unless `APP_ACCESS_TOKEN` is at least 16 characters. Reviewers enter this password in **AI settings**; they never receive your Gemini key.

## Verify the code

```sh
npm run check
npm test
npm run build:preview
```

30 unit / HTTP-integration tests cover ranking, evidence validation, IDs, uncertainty, exclusions, metrics, credentials, request limits, image input, timeouts and provider failures. Provider responses are mocked: they do not establish live Gemini quality.

`tests/browser_smoke.py` adds 12 isolated Chromium UI checks. It requires Python Playwright and a Chromium executable. The delivered QA report explains the mocked-storage limitation of this environment. The browser test is optional and not needed to run the app.

## Important boundaries

This is a small-library, single-process MVP, **not Google Photos itself**. It does not connect to Google Photos, import an entire account, perform facial recognition, read EXIF, reconstruct missing photos, or establish growth/retention lift. Suggested event groups are metadata/category heuristics, not verified real-world event boundaries. Captions and semantic ranking can be wrong.

Selected copies and descriptions are stored in this browser's IndexedDB; queries and task history use localStorage. This is not encrypted storage. The server stores neither photos nor a persistent user database. Requested AI processing goes to Google Gemini under your account's applicable terms. Use consented, non-sensitive photos for public testing and HTTPS for a remote deployment.

## Project map

- `public/`: application UI, shared ranking utilities, sample metadata and deck-derived assets.
- `lib/ai.mjs`: Gemini REST calls, prompts, JSON schemas, timeout/error handling.
- `server.mjs`: dependency-free HTTP server, key isolation, reviewer auth and rate limits.
- `tests/`: engineering tests, not participant research.
- `docs/`: brief mapping, architecture, privacy/deployment guidance and test protocol.
- `MemoryTrail_Part5_Preview.html`: self-contained, non-AI interactive preview.
