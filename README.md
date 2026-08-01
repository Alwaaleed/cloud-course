# Majal — Cloud Computing

A 5-day, offline Reveal.js course. Every day runs straight from `file://`
(no server, no build) by opening its `index.html`.

## Layout

```
.
├── shared/              # framework + brand, shared by every day
│   ├── dist/            #   Reveal.js core (vendored, committed for offline use)
│   ├── plugin/          #   Reveal plugins (notes, highlight, …)
│   └── css/course.css   #   Majal brand kernel — do not add topic CSS here
├── day1/ … day5/         # one folder per day = that day's content only
│   ├── index.html       #   links ../shared/… for framework + theme
│   ├── js/state.js      #   engine: brand chrome, widget registry, Reveal boot
│   └── widgets/         #   _shared.css + one standalone .html per interactive
├── tools/md2lab.py      # lab markdown → standalone offline HTML page
└── WIDGET_AUTHORING_GUIDE.md   # the quality bar — read before authoring
```

## Role colours

Fixed for the whole course — do not re-map these on a later day:

| Role | Colour | Used for |
|---|---|---|
| **You / the client side** | teal `#1f8f89` | what the learner manages or controls: the layers above the boundary, the SSH client, an allowed packet, a permission bit that is on |
| **The provider / the server side** | petrol `#00567d` | what Alibaba runs: layers below the boundary, the ECS instance, the VPC, headings and structure |
| **Blocked / refused** | red `#d64545` | a dropped packet, a rejected key, a line filtered out by grep, a clobbered file |
| **Attention** | yellow `#f2d200` | the draggable boundary, the grep gate — the one thing on screen to grab |

## Partner logos

`Saudi-Azm.png` and `sccc-by-stc.png` sit at the repo root next to `MajalLogo.jpg`
(both trimmed of their transparent padding, so a CSS `height` sizes the visible
mark). Use the `.partners` strip — title slide, closing slide and the landing
page carry it; the rest of the deck stays on the Majal chrome alone.

Per **sccc guidelines §04.3, "led by a third party"**: the lead logotype is 100%
and the *rectangular* sccc endorsement lockup — the one in this repo — is **60%
of its height**. Keep that ratio if you resize. Use the POS (positive) artwork;
the decks are light-background. NEG is only for dark slides.

## Labs

```
python3 tools/md2lab.py day1/lab1.md day1/lab1.html "Day 1 · Lab 1" "Cloud Computing 2026"
```

Edit the `.md`, re-run, commit both. (Needs `mistune`; the output has no runtime
dependencies and opens from `file://` like the decks.)

## Deploying

GitHub Pages, from the default branch, repo root. `.nojekyll` must stay at the
root or every `widgets/_shared.css` 404s. Bump `?v=N` on changed assets.
