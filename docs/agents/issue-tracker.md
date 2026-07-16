# Issue tracker: Checkboxes in plans

This repo does not use a formal external issue tracker (no GitHub Issues, Jira, Linear, etc.). Work is tracked as **checkbox lists inside plan documents**.

## Conventions

- A "ticket" is a single checkbox item (`- [ ] ...`) in a plan.
- Plans live as markdown files under `.scratch/<feature-slug>/plan.md` (create the directory if needed). A spec/PRD, when one exists, lives at `.scratch/<feature-slug>/spec.md`.
- Group related checkboxes under `##` / `###` headings that name the phase or area of work.
- Mark progress by checking the box (`- [x]`) — never delete completed items; they are the record of what was done.
- Keep each checkbox small and independently verifiable. Split anything that needs multiple distinct changes into multiple boxes.

## When a skill says "publish to the issue tracker"

Add the item(s) as checkboxes to the relevant plan file under `.scratch/<feature-slug>/plan.md`, creating the file/directory if it doesn't exist. Do not call out to any external CLI.

## When a skill says "fetch the relevant ticket"

Read the corresponding checkbox (and its surrounding heading/context) from the plan file. The user will normally point at the plan file or name the specific item.

## Triage

Triage is not used in this repo. Skills that would otherwise apply triage labels should skip that step.

## PRs as a request surface

Off. External pull requests are not part of a triage/intake queue for this repo.

## Wayfinding operations

Used by `/wayfinder`. Everything lives as markdown under `.scratch/<effort>/`, expressed as checkboxes in the plan.

- **Map**: `.scratch/<effort>/map.md` — holds the Notes / Decisions-so-far / Fog body, plus the list of decision tickets as a checkbox list (`- [ ] NN — <question>`).
- **Child ticket**: a checkbox item in `map.md`, expanded in a detail file at `.scratch/<effort>/tickets/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top of the ticket file. A ticket is unblocked when every ticket it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/tickets/` for tickets that are open, unblocked, and unclaimed; lowest number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, check the ticket's box in `map.md` (`- [x]`), then append a gist + pointer to the map's Decisions-so-far.
