# Day 5 cluster setup checklist

Instructor-side infra to provision before running Day 5 ("Kubectl day").
Referenced from `HANDOVER-day5.md` §4 — that doc explains *why* each piece
is needed; this is the actionable checklist for actually setting it up.

---

## Cluster access (the biggest new item — Days 1-4 never needed this)

- [ ] Decide the kubectl auth mechanism for students — Day 4 used the
      Alibaba console (their own account/RAM login), but `kubectl` needs a
      kubeconfig with real credentials. Pick: per-student RAM user mapped to
      cluster RBAC, or a static ServiceAccount token per namespace.
- [ ] Create a `Role` + `RoleBinding` per student namespace scoped to exactly
      what they need: `deployments`, `services`, `horizontalpodautoscalers`,
      `pods` (get/list/watch/create/delete), `pods/exec`, `pods/log`. Reuses
      the Day 4 namespace.
- [ ] Generate and distribute each student's kubeconfig (or token) — same
      spirit as handing out SSH keys on Day 1.
- [ ] Verify one test kubeconfig can only see/act on its own namespace, not
      anyone else's — Day 4's "walled off" guarantee was UI-enforced before;
      now it must be RBAC-enforced.

## DNS & TLS

- [ ] Install external-dns on the cluster, Cloudflare provider, scoped to
      the `alialjaffer.com` zone.
- [ ] Explicitly set records DNS-only (`--cloudflare-proxied=false` or
      equivalent) — don't rely on the default silently being right.
- [ ] Confirm port 80 is reachable on the front-door LoadBalancer for each
      student (needed for the ACME HTTP-01 challenge), not just 443.
- [ ] **Let's Encrypt rate limit plan**: all student subdomains share one
      registered domain (`alialjaffer.com`), capped at 50 new certs/week
      *total*. Count your rehearsal run(s) + the live session against that
      budget — don't let dry runs eat the quota before the real class. The
      per-hostname duplicate-cert limit (5/week) mainly bites if a single
      student's front-door pod crash-loops and re-requests repeatedly.

## Images

- [ ] Build and push the custom front-door Caddy image (`FROM
      caddy:2-alpine` + your `Caddyfile`), get its real registry reference —
      this is currently a placeholder in the curriculum.
- [ ] Confirm students' `cloud-explorer` image already includes the
      `POD_NAME`/pod-name patch from `majal-app` (they need to rebuild+push
      their own image with this change before Day 5).

## Capacity & quota

- [ ] Check Alibaba SLB quota — each student's front-door Service (`type:
      LoadBalancer`) provisions its own SLB instance; a full class needs
      quota for that many, on top of whatever Day 4 already used.
- [ ] Check node pool capacity (or that cluster autoscaling is on) for the
      load-test spike: every student's HPA can scale toward its `--max` at
      roughly the same time. Rough budget: `students × max-replicas ×
      cpu-request` (e.g. 25 × 10 × 50m ≈ 12.5 vCPU) plus each student's
      pinned front-door pod.
- [ ] Confirm metrics-server is running on the cluster — required for both
      `kubectl top` and for HPA to read CPU% at all.

## Load-test tooling

- [ ] Decide how students get `hey` — pre-install on their machines, or
      bake it into an image/devcontainer they already have.

## Rehearsal

- [ ] Do one full dry run yourself: create a front-door + backend pair,
      confirm DNS resolves, cert issues, HPA scales up under `hey` and back
      down within the tuned window, pod-name display updates on refresh —
      before trusting it live with a full class.

## KubeAssassin target assignment (`day5/kubeassassin.html`, unlinked page)

1. Write each namespace on its own card, exactly once, no repeats.
2. Shuffle once, lay all cards face-up in a single line.
3. Hand each student the card one position after their own in the line,
   wrapping the last position back to the first.

Projector view, all namespaces sorted by current replicas (lowest/safest on
top, closest-to-death at the bottom, since everyone shares the same
`maxReplicas: 15` ceiling):

```bash
watch -n 2 'kubectl get hpa -A --sort-by=.status.currentReplicas'
```
