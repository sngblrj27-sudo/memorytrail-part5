# Part 5 pilot protocol / handoff to user testing

The app is the deliverable. This protocol is preparation, not a claim that any target-segment participant has tested it.

## Recruit and prepare

Recruit parents/family members who organize photos around occasions and have recently struggled to retrieve a specific remembered photo. Use the target segment in the supplied deck. For a real-photo task, ask the participant to select a consented subset that actually contains the target, along with plausible alternatives. Do not silently substitute a sample illustration for a real retrieval task.

The facilitator records an anonymous participant code and selects the intended target using **Run a retrieval test**. Do not reveal the target's file title or tell the participant the exact clues to type. Use a known sample target first only to familiarize the facilitator with the controls. Keep those sample runs out of the participant results.

## Participant task

Ask: "Think of the photo you were trying to find. Use what you remember to look for it. Tell me when you find the exact image, or when you would stop trying."

Do not coach keywords. Observe the initial memory, corrections, evaluated candidates, refinements and explicit stopping point. Afterward, ask what clue was missing, what seemed incorrectly understood, whether the explanation helped, and how they would search differently next time.

For the deck's scenario, the sample target `birthday-child` contains a child in a red dress and a birthday cake. `red-dress-play` is a near-match without the cake. This is a deliberately authored fixture, not evidence of a user's real memory.

## Operational definitions implemented by the app

| Measure | Definition | Important limitation |
|---|---|---|
| Completed attempts | User-confirmed + explicitly abandoned | Active and interrupted attempts are excluded and separately visible |
| Self-reported find rate | Confirmed / completed attempts | Not proof the intended target was found |
| Target-verified success | Correct target-ID confirmations / completed attempts with a preselected target | Depends on valid facilitator ground truth; explicit abandonment is a failure |
| Time to confirmation | Median `(confirmation timestamp − first-search timestamp)` for confirmed tasks | Conditional on confirmation; failed/interrupted tasks remain in exports |
| Refinement engagement | Completed attempts with more than one successful search round / completed attempts | Not every filter click or failed request is a successful round |
| Explicit abandonment | Participant uses the end-attempt control, starts over, or switches collection during an active task | A reload is interrupted, not silently classified as failure |
| Diagnostic events | Clue edits, search rounds, model/latency/tokens when returned, openings, rejections, group browsing, confirmation/undo | These alone do not measure interpretation accuracy |

The timer starts when the first search is submitted, not at upload or indexing. Time on other tabs/views is not subtracted. Replaying a trail creates a new attempt. If a participant confirms the wrong preselected target, the task is recorded as incorrect; undoing returns the attempt to active. Ground-truth IDs are never sent to the search model.

## Review and report honestly

Export JSON for diagnostic detail and CSV for per-attempt outcomes. Filter sample versus uploaded-photo attempts. Look at failures and interrupted tasks, not only successful timings. Assess whether the described problem and proposed solution hold for these users. Compare against their current retrieval workflow under comparable conditions before claiming an improvement.

No before/after lift, statistical significance, user-level retention or growth can be inferred from the bundled sample or engineering tests. Replace any presentation placeholders with genuinely observed findings. Obtain appropriate consent before collecting photos or sharing a public prototype.
