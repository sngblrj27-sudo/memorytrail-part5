# Engineering QA — 2026-10-04

## Passed

**30 Node.js tests**, executed on Node.js 22.16.0 using `npm test`.

Coverage: the deck's birthday/red-dress scenario; compound color/object matching; uncertain dates; certain/uncertain exclusions; empty results; rejection/undo; ignored clues; grouping; unknown IDs; hallucinated evidence; strong-versus-partial labels; manual identity tags; zero-denominator metrics; interrupted/abandoned/confirmed/target-verified distinctions; descriptor privacy; HTML escaping; HTTP routes; private-file blocking; configuration secrecy; reviewer auth; cross-origin rejection; request/content limits; global rate limiting; visible provider failure; bounded timeout; malformed model JSON; actual image-payload construction; unsupported image rejection; and withholding test targets from the model.

**12 isolated Chromium interface checks**, including desktop (1440 px) and mobile (390 px) rendering with no page errors or horizontal mobile overflow.

Coverage: initial sample collection; deck scenario; rejection/undo; editable clues; confirmation/undo; no results; facilitator target check; downloadable event log; selected-image resize/import and manual metadata search; search trail; mobile layout; and transparent unconfigured-AI state.

## Test boundaries

Gemini responses were mocked. These tests verify request/response handling and the UI flow, not live provider access, actual visual interpretation or semantic retrieval accuracy.

Browser URL navigation is restricted in this execution environment. UI tests injected the generated preview into an isolated Chromium document and explicitly supplied in-memory storage doubles. Native IndexedDB persistence, ordinary localhost navigation, Safari/Firefox behavior and microphone-provider behavior were not verified here. The Node HTTP server itself was tested over real loopback HTTP.

The app's deployable module code passes JavaScript syntax checks. The generated one-file preview passes isolated browser interaction checks. Docker/public hosting was not run, and no public URL is included.

Engineering tests and screenshot fixtures are not participant results. The delivered application contains no prefilled search history or test outcomes. Run the manual deployment and participant checks before treating this as a submitted, live-validated MVP.
