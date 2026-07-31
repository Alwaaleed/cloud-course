# The interactivity bar

**Read this before building any slide content.** It is the standard for every
interactive in a Majal course, in any field. The reference point is the Majal
**AI-track** decks (e.g. day 3 "convolution-live"): widgets that **animate and
let you play with real, useful visuals** — images, pixels, moving shapes, drawn
diagrams — **not walls of text and `<div>`s.**

If your widget is a form the learner *reads*, you have failed the bar. It must be
a **toy the learner drives**, where every control produces a visible consequence.

---

## 0. The one rule that matters most

> **Show the concept as a moving picture the learner manipulates — not as text.**

The convolution widget draws a **real photo** on a `<canvas>`, walks a kernel box
across it, and paints the output feature map pixel-by-pixel as you press Play and
change the kernel/stride/padding. That is the target: *spatial, visual, animated,
configurable, consequence-driven.*

Before writing a widget, ask: **"What is the moving image here, and what does the
learner grab to change it?"** If your answer is "a table of numbers updates,"
push harder — find the picture.

Every field has its picture. If you cannot find it, that is a signal about the
slide, not about the medium:

| Field | The picture, not the prose |
|---|---|
| ML / AI | pixels of a real photo transformed; a loss surface a ball rolls down; attention weights lighting up over a sentence |
| Networking | a packet crossing a wire, being rewritten at each hop |
| Databases | rows streaming through a query plan; an index tree being descended |
| Distributed systems | messages in flight between three nodes; a partition you can draw with the mouse |
| Compilers | source text collapsing into a syntax tree, then into instructions |
| Robotics | a arm's reachable workspace filling in as joint limits move; sensor noise as a cloud around a true pose |
| Graphics | the actual rasteriser filling triangles one scanline at a time |
| Security | a payload crossing a trust boundary and being blocked or getting through |

## 0.1 When NOT to build an interactive (read this first)

**A widget must reveal something the audience does not already know.** If the
point is common sense to a technically literate learner — "reusing a password is
risky", "more data is better", "caching makes it faster" — then a toggle-sandbox
that merely *restates* it is **worse than a good paragraph**: it dresses a truism
as discovery, wastes the learner's time, and usually misses the visual bar
anyway. In that case, **delete the widget and write a sharp explanation** using
the deck's native `.card` / `.callout` styles.

Build an interactive only where **manipulation exposes something you cannot just
tell someone** — a counter-intuitive result, a mechanism that clicks only when
you drive it, a relationship you feel by moving a slider (the avalanche effect;
Diffie–Hellman's two sides meeting; why a learning rate that is too high
diverges; why a base rate destroys a 99%-accurate detector).

Litmus test: *if a single sentence conveys it, a sentence should.*

## 0.2 Background knowledge IS content — teach prerequisites first

§0.1 rejects *fake interactives* that restate the obvious. It does **not**
license skipping foundations. **Prerequisite knowledge is first-class content.**
Before an advanced idea can land, the learner needs the substrate it rests on —
how the request/response cycle works before injection attacks; what a tensor
shape is before broadcasting; what a transform frame is before inverse
kinematics. A demo that assumes a mental model the learner doesn't have teaches
nothing; it just looks impressive to people who already knew.

- **Give foundations a BLOCK of slides, not a token on-ramp.** One slide rarely
  carries a 6-hour day. Err toward *more* substrate than feels necessary. (The
  cyber Day 4 runs five foundation slides before the first attack: request/
  response, HTTP verbs, status-code families, the five input channels,
  statelessness and session cookies.)
- **Method: list what the payload silently assumes, then teach each piece.**
  Write down the mental model the main content demands, and give every
  load-bearing piece its own deliberate treatment before you get there.
- **Match the tool to the job.** A foundation can be a sharp `.card`/`.callout`
  explanation (a taxonomy, a definition, an anatomy) **or** a mental-model
  interactive where driving it *builds* the model. Both are legitimate; pick by
  whether motion adds understanding. A foundation interactive earns its place
  when manipulation *constructs* the model, not when it restates a truism.
- **Don't over-teach.** Establish exactly enough substrate for the main content
  to make sense. Fold the smallest primers inline into the slide that needs them;
  give a full slide only to the load-bearing model.

Litmus: *would the next slide be a magic trick to someone who doesn't already
know this?* If yes, teach it first.

---

## 1. Non-negotiable constraints (offline / air-gapped)

The decks run from `file://` on machines with **no internet**. Therefore:

- **No CDN, no external `<script>`/`<link>`, no web fonts, no `fetch`/XHR/WebSocket.**
- **Everything inline or vendored.** Images embedded as `data:` URIs (base64).
  CSS/JS live in the widget file or in `dayN/widgets/_shared.css`.
- Fonts: the system stack already in `_shared.css` (`"Avenir Next", "Segoe UI",
  system-ui, …`) and `"JetBrains Mono", Menlo, Consolas, monospace`. **Never**
  `@import` Google Fonts.
- No analytics, no telemetry, no third-party anything.

Test by opening the raw file over `file://` — if it needs the network, it is broken.

---

## 2. The four axes — what "as good as the AI slides" means

Rank your idea against these. Aim for the top of each.

**A. Real visuals over text.**
- **Do:** draw on `<canvas>` — images, pixels, particles, graphs, geometry,
  animated diagrams. Embed real photos/data as base64 and manipulate them
  (`getImageData`/`putImageData`).
- **Don't:** stack `<div>`s of prose and call it interactive. A wall of captions
  is a document, not a simulation.

**B. Direct manipulation with continuous feedback.**
- Sliders, drags, toggles and clicks that **recompute the picture in real time**
  as you move them — not "set a value, press submit".

**C. Animation.**
- Things **move**: `requestAnimationFrame` loops, CSS transitions, a Play button
  that runs a sequence, a value that travels/scrambles/fills. Motion carries
  meaning (a packet crossing a wire, a kernel walking an image, half a hash
  flipping).

**D. Agency / role-play.**
- Let the learner **be** someone with stakes: the attacker on the wire, the CPU
  scheduler, the router, the optimiser. Give them buttons that *do* something and
  outcomes that can succeed or fail.

**E. Consequence-driven, not quiz-shaped.**
- Every control changes an outcome the learner can see and reason about.
- **Never** build "pick the right option → reveal the answer." That is a quiz,
  not a simulation. Banned.

**F. Honest at toy scale.**
- Use **real mechanisms with small numbers** (tiny-RSA `e=3, n=55`; an 8×8 image;
  a 3×3 kernel; a 4-row table). Compute the real thing, then state the real-world
  scale in one line ("real keys are 2048-bit", "real images are millions of
  pixels"). Never fake the math.

**G. Reveal the mechanism through play.**
- The learner should *discover* the rule by manipulating, not read it in a
  paragraph. The paragraph is a fallback, kept to one line.

---

## 3. The three proven archetypes

Pick one deliberately; most good widgets are exactly one of these.

**Live manipulator** — sliders/toggles recompute a canvas or scene every frame.
Best for relationships and "feel the trade-off". *Diffie–Hellman: drag either
secret, both sides still land on the same key. Convolution: change the kernel,
watch the feature map.*

**Stepped player** — `▶ Play / Next / Back / Reset` with a caption bar and dot
progress; the scene **accumulates** as steps advance. Best for a fixed narrative
with real values. *The digital-envelope widget; a packet's journey; a query plan
executing.*

**Adversary / agent sandbox** — the learner plays a role, flips a few
protections, fires actions, and each action carries a live **succeeds/blocked**
badge. Best for "why you need X". *The tamper lab; a rate limiter under load; a
scheduler under contention.*

---

## 4. Recipes

### 4.1 Crisp canvas with DPR + animation loop
```js
var canvas = root.querySelector("canvas"), ctx = canvas.getContext("2d");
var W = 900, H = 336;
function fit() {
  var cssW = canvas.clientWidth || W, dpr = window.devicePixelRatio || 1;
  canvas.width = cssW * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); W = cssW; draw();
}
window.addEventListener("resize", fit);
function loop(now) { update(now); draw(); raf = requestAnimationFrame(loop); }
```

### 4.2 A REAL image you can manipulate
Embed a photo as base64, draw it, read its pixels, transform, paint the result.
```js
var img = new Image();
img.onload = function () {
  var c = document.createElement("canvas"); c.width = N; c.height = N;
  var g = c.getContext("2d"); g.drawImage(img, 0, 0, N, N);
  var px = g.getImageData(0, 0, N, N).data;      // real pixels to compute on
  var out = octx.createImageData(N, N);
  for (var i = 0; i < N*N; i++) { var v = compute(i, px);
    out.data[i*4]=v; out.data[i*4+1]=v; out.data[i*4+2]=v; out.data[i*4+3]=255; }
  octx.putImageData(out, 0, 0);
};
img.src = "data:image/jpeg;base64,/9j/4AAQ…";     // embedded, offline-safe
```
Use `imageSmoothingEnabled = false` when scaling small grids so pixels stay crisp.

### 4.3 Sizing
The slide canvas is `1280 × 720`, top-aligned. After the kicker and title you
have roughly **~560 px of iframe height** at ~1080 px wide. Set the iframe
`height` explicitly and design to fit. Use `scrolling="auto"` only if an optional
expand can overflow.

---

## 5. Testing workflow (do this every time)

Render the widget headless at the real iframe size and **look at the screenshot**
— check nothing overlaps, nothing clips, and the numbers are right.

```bash
scripts/shot.sh dayN/widgets/my_widget.html out.png    # 1080x566 by default
```

- Add a `?state=…` query hook so you can screenshot specific states.
- Verify any math independently (run the same computation in `node` or `python`)
  and check for collisions in toy hashes before shipping.
- After deploy, poll the **live** URL until the new file is `200` and the index
  references it; then hard-refresh (`Ctrl+Shift+R`).

---

## 6. Pre-ship checklist

- [ ] Runs fully offline over `file://` (no network, no CDN, no web fonts).
- [ ] There is a **moving/visual** element the learner **manipulates** — not just text.
- [ ] Every control has a **visible consequence**; nothing is a read-only form.
- [ ] It is **not** a quiz ("pick option → reveal answer").
- [ ] Real mechanism at toy scale; real-world scale stated in one line.
- [ ] Fits ~560 px tall at ~1080 px wide; nothing clips or overlaps (screenshot-checked).
- [ ] Uses `_shared.css` + the brand palette; role colours consistent with the rest of the course.
- [ ] Cache-bust `?v=N` bumped; `.nojekyll` present.
- [ ] Presenter `<aside class="notes">` says what to click and what to land.
