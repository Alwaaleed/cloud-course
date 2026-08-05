# Handover — Day 5 slides & lab ("Kubectl day")

Day 5 was redesigned from scratch (Git/PR/capstone → hands-on kubectl +
autoscaling). The curriculum source is finished and merged; **the slide deck
and lab for Day 5 still need to be built** — `day5/index.html` is currently
just the unfilled scaffold from `new-day.sh`. This doc briefs whoever picks
that up.

Follow the `majal-course` skill (`~/Downloads/SKILL.md`) and this repo's
`CLAUDE.md` for standards — this doc is the content brief on top of those,
not a replacement for either. Read `WIDGET_AUTHORING_GUIDE.md` before
building any widget.

---

## 1. Source of truth

- `/Users/h/majal/curriculum/5day/day5-session1.md`
- `/Users/h/majal/curriculum/5day/day5-session2.md`

These are final and merged. Every task, milestone number, command, and
fill-in-the-blank in the deck/lab must match them exactly (per `CLAUDE.md`'s
"Matching curriculum" rule). **Do not edit the generated
`day5-session1.ipynb` / `day5-session2.ipynb`** — they're build artifacts of
`curriculum/md_to_ipynb.py`; if the `.md` needs a further tweak, edit that and
regenerate.

Milestone numbers are **9** (session 1) and **10** (session 2) — continuing
the sequence from Day 4's Milestone 8.

---

## 2. What Day 5 now teaches, in brief

**Session 1 — kubectl fundamentals + a real domain.** Yesterday (Day 4)
students clicked Pods/Deployments/Services into being in the Alibaba console.
Today they drive the same shared ACK cluster from their own terminal with
`kubectl`: `kubectl run` (bare Pod, no self-healing) → `kubectl create
deployment` + `kubectl expose` (typed version of yesterday's objects) →
annotations. The payoff: their badge goes live at a **real subdomain**
(`<name>.alialjaffer.com`) with a **real TLS certificate**, and the page
itself displays which literal Pod served the request.

**Session 2 — autoscaling + class-wide load-test showdown.** Manual `kubectl
scale` → HPA (`kubectl autoscale`) → tuning the HPA `behavior` block so
scale-up *and* scale-down both react in ~15s instead of the default 5-minute
scale-down cooldown → everyone runs `hey` against their own subdomain at once
and watches `kubectl get hpa --watch` / `kubectl top pods` live.

### The architecture behind it (needed to build the slides correctly)

A naive "just run Caddy in every replica" design breaks under autoscaling:
each pod's filesystem is independent, so N replicas means N independent
Let's Encrypt cert requests for the same hostname (hits the 5/week duplicate-
cert limit), and the HTTP-01 challenge can land on a different replica than
the one that started it. The fix is to split the app into two pieces:

```
Browser/hey → https://<name>.alialjaffer.com
                    │  (external-dns watches this Service's annotation,
                    │   writes the DNS record; Cloudflare zone set to
                    │   DNS-only so `hey` hits the real origin directly)
                    ▼
      Service: caddy-front-door (type: LoadBalancer)
                    ▼
      Deployment: caddy-front-door (replicas: 1, PINNED — never autoscaled)
        - instructor's own custom Caddy image
        - env SITE_ADDRESS=<name>.alialjaffer.com  → the real domain + cert
        - env SERVICE_NAME=badge (fallback default) → who it proxies to
        - gets the ONE cert for this hostname — no race, no rate-limit issue
                    │  reverse_proxy, plain HTTP, internal only
                    ▼
      Service: badge (type: ClusterIP, no external IP)
                    ▼
      Deployment: badge — THIS is what the HPA scales
        - students' own cloud-explorer image (built on Day 2)
        - POD_NAME env var via the Downward API (fieldRef: metadata.name)
        - never touches TLS/DNS — just plain HTTP, scales freely
```

Only the **front-door Service** carries the `external-dns.alpha.kubernetes.io/hostname`
annotation, and only the **front-door Deployment** is pinned at 1 replica.
The **HPA** targets only the `badge` Deployment.

This split is also *why* the badge app now shows which Pod served it (see
§3) — it's visible, tangible proof that the HPA-scaled fleet behind the
front door is real, especially when refreshing mid-load-test.

---

## 3. `majal-app` source changed — slides/labs referencing it must account for this

`/Users/h/majal-app` (the Day 2 starter repo students fork) was edited to add
the pod-name display feature Day 5's milestone depends on:

Only two files have a net change (verified with `git diff` — `App.css` was
touched mid-session but ended up back at its original content, so it carries
**no diff at all** and is not part of this changeset):

- **`index.html`** — new `<meta name="pod-name" content='{{env "POD_NAME"}}' />`
  in `<head>`, using the same Caddy `templates`-directive substitution
  already used for `og:image`. Also a new inline `<style>` block in `<head>`
  for `.page-heading .pod-name` — kept inline in `index.html` rather than in
  `App.css`, per explicit instruction.
- **`src/App.tsx`** — reads that meta tag at module scope (`podName` const)
  and renders `served by pod: {podName}` under the existing "Deployed by me,
  running on..." line in the `page-heading` block, only when the value is
  non-empty (i.e. only when actually running as a Pod with `POD_NAME` set).

**Implications for slide/lab content:**

- Any Day 5 slide/lab walkthrough of "here's your `index.html`" or "here's
  your `App.tsx`" must show the **current** file contents, not what's in any
  earlier day's screenshots or cached snippets — re-read the files fresh
  rather than reusing an older description.
- If Day 5's deck wants to show the Downward API concept concretely (a good
  candidate for a `.card` explanation or a small widget — "watch the env var
  come from the Pod's own metadata"), the real diff is exactly the three
  bullets above — use it verbatim rather than inventing a different example.
- I checked Day 1–4's existing decks/labs for stale references to these two
  files (`grep` for `og:image`, `page-heading`, `CONFIG.`, `App.tsx`,
  `index.html`) — the hits in `day2/index.html:176` and `day2/lab2.md:76`
  are generic mentions of `App.tsx`/`CONFIG` unrelated to the lines that
  changed, so no update needed there. Worth a quick re-grep if more changes
  land in `majal-app` later.

---

## 4. Infra prerequisites — instructor-side, not student-facing

The curriculum assumes these already exist on the shared cluster/domain
before class starts. They are **not** things students configure, and slides
should present them as given (the same way Day 4's shared ACK cluster is
already-provisioned background, not something students set up):

- **external-dns** installed on the shared ACK cluster, watching Services
  cluster-wide for the `external-dns.alpha.kubernetes.io/hostname` annotation.
- **Cloudflare zone `alialjaffer.com`** — the records external-dns creates
  must be **DNS-only** (grey cloud, not proxied), both so `hey`'s load test
  hits the real origin instead of Cloudflare's edge, and so the ACME HTTP-01
  challenge isn't routed through Cloudflare's proxy.
- **The custom front-door Caddy image** — built and pushed to Docker Hub as
  `alialjaffer/caddy:latest`; source lives in `kubernetes/front-door/`
  (`Dockerfile` + `Caddyfile`) in this repo. The curriculum's
  `<front-door-image-from-your-instructor>` placeholder should be filled in
  with this reference. Its Dockerfile is trivial: `FROM caddy:2-alpine` +
  `COPY Caddyfile /etc/caddy/Caddyfile`, with the Caddyfile using
  `{$SITE_ADDRESS:localhost}` and
  `reverse_proxy {$SERVICE_NAME:badge-backend-svc}:80`.
- **Per-student kubeconfig** distribution so `kubectl` works from their own
  terminal against their Day 4 namespace (same namespace, reused — nothing
  new to create there).
- **metrics-server** on the cluster (needed for `kubectl top` and for HPA to
  read CPU usage at all) — likely already present on ACK, but worth
  confirming before class.

If any of these aren't actually set up yet, flag it back rather than writing
slides that assume they are — the deck's accuracy depends on it.

---

## 5. Cluster setup session (2026-08-05) — status and findings

Ran through `DAY5-CLUSTER-SETUP.md` against the live cluster
(`~/Downloads/ertiqa` kubeconfig). Status of each item, plus one real bug the
rehearsal caught:

- **external-dns**: installed (latest: chart `1.21.1`, app `v0.21.0`),
  Cloudflare provider, `domainFilters: [alialjaffer.com]`, records forced
  DNS-only, `policy: upsert-only` (never deletes — protects against a bad
  token/config wiping records, at the cost of never auto-cleaning up stale
  ones). Verified end-to-end with a real create/delete smoketest.
- **Front-door image**: built and pushed as `alialjaffer/caddy:latest`
  (source: `kubernetes/front-door/`). Its `reverse_proxy` now sets
  `transport http { keepalive off }` — without it, Caddy reuses one pooled
  connection to whichever `badge` pod it first dialed, so kube-proxy's
  per-*connection* load balancing never kicks in and refreshing the page
  keeps showing the same pod. `keepalive off` forces a fresh dial (and a
  fresh load-balancing pick) on every request.
- **Curriculum bug found and fixed**: `day5-session1.md`'s
  `badge-deployment.yaml` (Milestone 9 step 4) never set `SITE_ADDRESS` for
  badge. Badge's own Caddy (unchanged from Day 2) then defaults to
  `localhost` and auto-redirects HTTP → HTTPS on its own — but badge is only
  ever reached over plain HTTP, internally, by the front door's
  `reverse_proxy`. The front door just relays that redirect straight back to
  the client, so every student following the lab as originally written would
  hit an infinite redirect loop instead of seeing their badge. Fixed by
  adding `SITE_ADDRESS: ":80"` to badge's env in the curriculum source.
  Reproduced and confirmed fixed live before editing the curriculum.
- **Full rehearsal**: ran the real flow end-to-end in a throwaway
  `rehearsal-day5` namespace — real subdomain, real Let's Encrypt cert
  (production, via `tls-alpn-01`), pod-name display confirmed via the
  Downward API, HPA scaled 1 → 6 replicas under a 45s `hey -c 50` load test
  and back down to 1 within ~30s of load stopping (matching the tuned
  `behavior` block, not the default 5-minute cooldown). 55,714/55,714
  requests returned `200`. This rehearsal consumed one production Let's
  Encrypt cert — counts against the 50/week budget in
  `DAY5-CLUSTER-SETUP.md`.
- **Cloudflare API token** currently expires **2026-08-07** — reissue before
  class if Day 5 lands after that date.
- **SLB quota / node-pool autoscaling**: not verifiable from this machine —
  `aliyun cs DescribeClustersV1` returns an empty cluster list for both the
  `default` and `ertiqa` CLI profiles against `me-central-1` (likely a
  region/endpoint gap, not a real permissions issue, but unconfirmed). Needs
  a manual check in the ACK/SLB console before class.
- **`hey` distribution** to students: still an open decision, not resolved
  this session (confirmed `brew install hey` works fine on macOS for the
  instructor side).
- **RBAC / `cs:admin`**: `kubernetes/ertiqa-admin-clusterrolebinding.yaml`
  grants the `cs:admin` ClusterRole (full cluster-admin) to every student RAM
  user ID — this is checked into the repo intentionally, not a leftover
  mistake, and was left as-is per explicit instruction this session.

---

## 6. Build checklist

- [ ] `day5/index.html` — replace the placeholder scaffold. Two sessions'
      worth of content (see §2), following the `.k2`/`.pipe`/`.callout`
      patterns already sketched in the placeholder's `<style>` block and used
      concretely in `day3/index.html` / `day4/index.html`.
- [ ] `day5/js/state.js` — dayflag is currently `"DAY 5 · DAY 5 TITLE"`;
      update it (suggest something like `"DAY 5 · KUBECTL & AUTOSCALING"`,
      matching the short-caps style of `day3`'s `"DAY 3 · ADDRESSING &
      PROTECTION"` and `day4`'s `"DAY 4 · KUBERNETES"`).
- [ ] `day5/widgets/` — replace the `my_widget.html` skeleton with real
      widget(s), if any concept earns one per the quality-bar (the HPA
      scale-up/scale-down behavior tuning, or the front-door/backend split
      diagram, are plausible candidates — but per the skill, default to a
      sharp `.card`/`.pipe` explanation unless manipulation genuinely
      reveals something a sentence can't).
- [ ] `day5/lab5.md` → generate `day5/lab5.html` via
      `python3 tools/md2lab.py day5/lab5.md day5/lab5.html "Day 5 · Lab 5"
      "Cloud Computing 2026"`. Both sessions have real hands-on milestones
      (unlike Day 4 Session 1, which was concepts-only) — check
      `references/labs.md` for how to structure a two-session lab.
- [ ] `public/day5-*.yaml` — downloadable YAML assets matching the
      fill-in-the-blank tasks, following the `public/day4-deployment.yaml` /
      `public/day4-service.yaml` convention. Day 5 needs at least:
      `day5-badge-deployment.yaml`, `day5-front-door.yaml`, `day5-hpa.yaml`.
      Make sure `day5-badge-deployment.yaml` includes the `SITE_ADDRESS: ":80"`
      env var (see §5) — dropping it reintroduces the redirect-loop bug found
      during this session's rehearsal.
- [ ] `public/day5.pdf` — generate once the deck is real:
      `cd tools/pdf && node gen_pdfs.mjs day5`. Add the same "⭳ PDF" button
      to `day5/js/state.js` that other days' `state.js` files have.

---

## 7. Pre-existing drift, unrelated to this handover (flagging, not fixing)

Not part of this task, but noticed while cross-checking Day 4 as the closest
precedent — worth a look if anyone's doing a broader consistency pass later:

- `day4/lab4.md` deploys the generic `nginxdemos/hello` demo image, but
  `curriculum/5day/day4-session2.md` (the source of truth) has students
  deploy their own `<your-dockerhub-username>/cloud-explorer` image instead.
- `day4/lab4.md`'s header states "Session 1 is concepts, no hands-on work,"
  but `day4-session1.md` has a real hands-on Milestone 7 (OSS bucket +
  posterUrl edit).

Neither affects Day 5 directly, but both are exactly the kind of
deck/lab-vs-curriculum mismatch `CLAUDE.md`'s "Matching curriculum" rule
exists to prevent.
