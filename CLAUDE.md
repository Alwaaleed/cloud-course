# cloud-course — working rules

This repo is the Majal Cloud Computing Bootcamp: Reveal.js decks
(`dayN/index.html`) plus hands-on labs (`dayN/labN.md`, rendered to
`dayN/labN.html`). Source of truth for content and flow is
`/Users/h/majal/curriculum/5day/dayN-sessionM.md`. Follow the `majal-course`
skill (`~/Downloads/SKILL.md`) for slide/widget standards; the rules below are
this repo's specific standards on top of it.

## Matching curriculum

- Every task, milestone number, secret name, command, and fill-in-the-blank in
  a deck or lab must match its curriculum session file exactly. When curriculum
  changes, update both the deck and the lab, not just one.
- Each session has its own Kahoot callout on its closing slide (two per day,
  one per session) — check both are present, don't assume one covers both.
- Don't add features/expansions curriculum doesn't have without asking; don't
  drop content curriculum has without asking.

## Links and guides

- Screenshot/walkthrough guides are vendored locally in `/guides` (not linked
  to Google Drive) so decks and labs stay offline-safe. Reference them with
  relative paths: `../guides/<file>` from `dayN/*.md` or `dayN/index.html`.
- If curriculum references an external resource (a repo URL, a guide, a
  screenshot), it must actually appear as a working link in the deck/lab —
  never leave it implied ("your instructor will share this") if a concrete
  fact exists to put in its place.
- When a step tells the learner to SSH in and shows a runnable `ssh` command,
  always give OS-specific context:
  - **macOS/Linux:** run it in **Terminal** — link `../guides/ssh.png`.
  - **Windows:** run it in **Git Bash** (same command), or use **MobaXterm** —
    link `../guides/MobaXterm.png`.

## Instructional clarity (cold-reader test)

Labs are read solo, without a presenter. Before shipping a lab step, check
that a technically literate reader with no other context could execute it:

- One instruction per step. Don't chain distinct actions with commas/"and"
  ("press X, type Y, and paste Z. Pick a folder, and say yes...") — break into
  a numbered list instead.
- Steps must run in actual execution order. Never write "you'll do this in
  section N, come back if working ahead" — reorder the sections instead.
- If a step repeats an earlier command (e.g. redoing a deploy by hand a second
  time), show the real command again rather than making the reader flip back
  and reconstruct it from memory.
- If real classroom state carries across days (e.g. most students already did
  X in a prior day's lab), branch the instruction — "if you already did X,
  skip to..." — instead of assuming everyone starts fresh. Point at wherever
  the reader actually is: if a whole day's work is already done, skip past all
  of it, not just past the next micro-step.
- A walkthrough/screenshot link goes *before* the steps it illustrates, not
  after — the reader should be able to open it before attempting the steps,
  not discover it as an afterthought once they're stuck.
- Show a concrete worked example for any transformation, not just the
  placeholder syntax — e.g. "the IP `47.253.1.100` becomes
  `47-253-1-100.sslip.io`," not just "`<your-ip-with-dashes>.sslip.io`."
- If a fallback path involves picking a setting/scope/permission, state the
  exact value required whenever the tool's default is wrong for the task
  (e.g. a Docker Hub access token defaults to Read-only, but pushing an image
  needs Read & Write) — never assume the default is fine without checking.

## Prerequisites trace back to an install step

If a lab's Setup section assumes a tool is already installed/running (e.g.
Docker Desktop on Day 2), that tool must have an actual install instruction in
an earlier lab — not just a mention on a presenter-narrated deck slide. Trace
every "you need X" line in a Setup section back to the lab step that told the
reader to install X; if there isn't one, add it.

## Lab build process

- `dayN/labN.md` is the source; `dayN/labN.html` is generated — never hand-edit
  the generated HTML.
- Regenerate after every edit to the `.md`:
  ```bash
  python3 tools/md2lab.py dayN/labN.md dayN/labN.html "Day N · Lab N" "Cloud Computing 2026"
  ```
- If the system `python3` fails on `pyexpat` (broken Homebrew build), use
  `/usr/bin/python3` instead.
