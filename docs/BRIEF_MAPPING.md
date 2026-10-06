# Source-of-truth mapping

Basis: the user's 10-slide **Google Photos 100M case study deck.pptx**. The source deck is left unchanged. The app's name, architecture, limits, detailed interactions and testing definitions are implementation choices, not additional research findings.

## Preserved framing

**Page 3 — Who we design for:** Event Archivists, parents and families, with photos around birthdays, weddings and school functions. The MVP does not use the earlier traveller/café segment as its target.

**Page 4 — What people remember and forget:** emotional context, visual cues and social context versus timestamps, organization and location. Input accepts fragments; neither date nor album is required. Visible cues can be analyzed. An emotional recollection is not treated as a reliably inferable mental state from pixels.

**Page 5 — Four-step funnel diagram:** recall what to search → type the query → evaluate results → refine search. The deck marks evaluation/refinement as drop-off points. The app focuses on explained results and reversible recovery rather than only adding a chatbot.

**Page 6 — Four breakdowns:** expression, interpretation, evaluation and refinement. Implemented through language input, structured visual descriptors and semantic ranking, event-oriented groups/rich previews, and guided refinement/search trails.

**Page 7 — Problem statement and example:** "Retrieval fails because rigid metadata can't match vague recollection." The central sample is the parent's birthday / child / red-dress memory, without requiring year, album or device.

**Page 9 — Metric framework diagram:** primary search success and time-to-photo; supporting refinement engagement and abandonment; diagnostic expression quality, interpretation accuracy and evaluation efficiency. The app supplies task-level event logs. Some diagnostics require facilitator labels and are not inferred automatically.

**Page 10 — Risks:** support guided prompts, combine clue types, explain/cluster candidates, preserve search trails and allow interactive confirmation/refinement. Identity recognition is not implemented; names are manual tags.

## Deliberate MVP scope decisions

The small-library implementation uses direct image selection, not a Google Photos account integration. Gemini describes visible cues during explicit indexing; subsequent ranking runs on these descriptions. Grouping uses a user-supplied event label where available, otherwise event category + provided date + setting. Unrelated events can be grouped together, especially when dates are absent.

The sample images are crops of the artwork on pages 1 and 7. Names, exact dates and event assignments were added as fictional fixtures. They are not extracted facts from those images.

The deck's growth mission, ratings, segment percentages, retrieval-difficulty percentage and voice-use percentage are not independently verified by this build and are not inserted into the application's observed metrics. The supplied deck is the design basis; this package supplies no new interviews, research findings or causal claims.
