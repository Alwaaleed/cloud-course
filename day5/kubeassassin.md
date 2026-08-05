# KubeAssassin — last namespace standing

**Majal Initiative · Cloud Computing Bootcamp**

| | |
|---|---|
| **Duration** | Whatever's left of the day, until one namespace remains |
| **Environment** | Your own terminal (`kubectl`, `hey`), same badge from Milestone 9 |
| **Level** | Optional, unofficial, entirely for bragging rights |
| **Format** | Live class-wide game — no grading, no milestone |

## Objectives

You'll be handed one secret target: another student's namespace. Find them,
attack them, and force their `badge` Deployment's autoscaler to hit its
ceiling. Confirmed kills inherit the victim's target. Last namespace standing
wins.

## Setup

**S.1** — Reset to a clean baseline, same as the end of Milestone 10:

```bash
kubectl scale deployment badge --replicas=1 -n <your-namespace>
```

**S.2** — Raise your ceiling and pace out how fast you climb toward it. This
patches the same HPA object from Milestone 10 — same name, updated spec:

```bash
kubectl patch hpa badge -n <your-namespace> --type=merge -p '{
  "spec": {
    "maxReplicas": 15,
    "behavior": {
      "scaleUp": {
        "stabilizationWindowSeconds": 0,
        "policies": [
          { "type": "Pods", "value": 2, "periodSeconds": 15 }
        ]
      }
    }
  }
}'
```

> This caps scale-up at +2 replicas every 15 seconds, no matter how hard
> you're hit. Under sustained attack that's roughly a minute and a half to
> climb from 1 to 15 — fast enough to watch happen live, not so fast that one
> burst one-shots you before you notice you're under attack. `scaleDown`
> keeps the tuned 15-second window from Milestone 10 untouched.

**S.3** — You'll be handed a card with one namespace on it. That's your
target.

---

## 1. Recon

Find your target's real hostname yourself. You already have everything you
need from earlier today — nobody's handing you the command for this one.

---

## 2. Attack

**2.1** — Point `hey` at your target's hostname, same tool as Milestone 10:

```bash
hey -z 90s -c 100 https://<their-hostname>/
```

**2.2** — Watch their damage. You won't see their `kubectl` output, but a
sustained hit is a sustained hit — keep the pressure on.

---

## 3. Confirm the kill

**3.1** — Open a second terminal, so `hey` keeps running in the first one
while you check their HPA in this one:

```bash
kubectl get hpa -n <target-namespace>
```

**3.2** — When `REPLICAS` reaches `MAXPODS` (15/15), that's a confirmed kill.

**3.3** — Report it in the class WhatsApp group: hold your target card up
against your laptop screen, with their maxed-out HPA visible behind it, and
send the photo as proof.

---

## 4. Inherit and keep hunting

A confirmed kill means you inherit your victim's target. Keep going until
someone gets you, or you're the last namespace standing.

### If you're killed

Stop attacking — you're out. Keep watching; the game isn't over until one
namespace remains.

---

## Rules of engagement

- Only attack your assigned target. No pile-ons, no free-for-all — this
  keeps the game fair and the cluster's load predictable for everyone still
  playing.
- Your own badge stays live and attackable the entire time you're still in
  the game — including while you're hunting someone else.
- When the game ends (or your instructor calls time), follow the same
  **Clean up** steps from the main lab — this game reuses your existing
  `badge`, `caddy-front-door`, and `hpa` objects, nothing new to remove
  separately.

### 🏆 You win when

Every other namespace has been eliminated, and yours is the last one
standing.
