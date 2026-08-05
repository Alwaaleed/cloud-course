# Lab 5 — Kubectl & autoscaling: drive your cluster from the terminal

**Majal Initiative · Cloud Computing Bootcamp**

|                 |                                                                     |
| --------------- | ------------------------------------------------------------------- |
| **Duration**    | A full day, across two sessions                                     |
| **Environment** | Your own terminal (`kubectl`, `hey`) against the shared ACK cluster |
| **Level**       | Beginner                                                            |
| **Format**      | Two milestones and two fill-in tasks, each with a hint              |

## Objectives

By the end of this lab you will have driven a real Kubernetes cluster from
your own terminal with **kubectl** — running a bare Pod, then a proper
Deployment and Service — and put your badge live at your **own real
subdomain**, with a genuine TLS certificate, behind a small front-door proxy.
In the second session you will scale that Deployment by hand, then hand the
job to a **HorizontalPodAutoscaler**, tune how fast it reacts in both
directions, and load-test your own subdomain alongside the rest of the class
at the same time.

## Setup

You need **kubectl** installed on your own machine, and the **kubeconfig**
your instructor hands you for the shared ACK cluster — the same way you got
an SSH key on Day 1. You're working in the **same namespace** you created on
Day 4; there's nothing new to create there. For Session 2 you also need
**`hey`** installed (`brew install hey` on macOS; ask your instructor for
your platform if you're not on macOS).

> **Before you start — pull in the pod-name display.** This week's badge got
> a small addition: a line showing _which Pod_ served your request. It lives
> in two files, `index.html` and `src/App.tsx`, in the original starter
> project. Pull just those two files into your own fork — this leaves your
> own `config.ts` and any other file you've customized completely untouched.
>
> 1. Open your project folder in VS Code, then open its terminal:
>    **Terminal → New Terminal** (top menu bar). Point at the original
>    starter project once:
>    ```bash
>    git remote add upstream https://github.com/aliAljaffer/cloud-explorer.git
>    git fetch upstream
>    ```
> 2. Pull in only the two changed files:
>    ```bash
>    git checkout upstream/main -- index.html src/App.tsx
>    git commit -m "Pull in pod-name display from upstream"
>    git push
>    ```
> 3. Rebuild and push your image, exactly like Day 2:
>    ```bash
>    docker build --platform linux/amd64 -t <your-dockerhub-username>/cloud-explorer .
>    docker push <your-dockerhub-username>/cloud-explorer
>    ```

> **How to use this lab:** read each task, try to build the answer yourself,
> and open the hint only if you need a nudge. The point is to _derive_ it,
> not to copy it.

> **The cluster and your namespace already exist.** The whole class deploys
> onto the **same shared ACK cluster** and the **same namespace** from Day 4.
> You are not creating either today.

---

## 1. kubectl: talking to your cluster from the terminal

**kubectl** is the command-line tool that talks to a Kubernetes cluster —
everything you clicked on Day 4, it can type. It knows which cluster and
namespace to talk to from a **kubeconfig** file.

**1.1** — Confirm your kubeconfig is loaded and pointed at the shared class
cluster — your instructor's kubeconfig has only one context, so kubectl uses
it automatically:

```bash
kubectl config get-contexts          # confirms your kubeconfig loaded correctly
```

**1.2** — See yesterday's objects from the terminal — same objects, new
window:

```bash
kubectl get pods -n <your-namespace>
```

> _Hint: everything below is scoped to `-n <your-namespace>` — the same
> namespace you created on Day 4. You're still walled off from everyone else
> on the shared cluster._

---

## 2. Pods the hard way: `kubectl run`

The bluntest tool in kubectl: create one bare Pod, no Deployment watching
over it.

**2.1** — Run it, inspect it, then delete it:

```bash
kubectl run scratch --image=nginx --port=80 -n <your-namespace>
kubectl get pods -n <your-namespace>
kubectl describe pod scratch -n <your-namespace>   # events, status, why it's (not) running
kubectl logs scratch -n <your-namespace>           # what the container printed
kubectl delete pod scratch -n <your-namespace>      # gone - and nothing replaces it
```

That last line is the point: delete a bare Pod and it's just gone. No
Deployment means no self-healing. This is exactly why Day 4 introduced
Deployments — now you'll create one yourself, typed.

---

## 3. Deployments & Services, typed this time

Same two objects as yesterday, but from the CLI instead of "Create from
YAML" in the console.

**3.1** — Create a Deployment and expose it:

```bash
kubectl create deployment badge --image=<your-dockerhub-username>/cloud-explorer:latest -n <your-namespace>
kubectl expose deployment badge --port=80 --target-port=80 -n <your-namespace>
```

Notice `kubectl expose` here makes a plain internal address (`ClusterIP`),
not a public one. That's deliberate — today's badge Deployment sits
**behind** a front door instead of facing the internet directly. More on why
in the next section.

| Verb                                | Does                                                             |
| :---------------------------------- | :--------------------------------------------------------------- |
| `kubectl run`                       | one bare Pod, no self-healing                                    |
| `kubectl create deployment`         | a Deployment - Pods that get replaced if they die                |
| `kubectl expose`                    | a Service - one stable address in front of the Deployment's Pods |
| `kubectl get` / `describe` / `logs` | look, look closer, read what it printed                          |
| `kubectl delete`                    | remove it                                                        |

---

## 4. Annotations: metadata other tools read

A **label** is metadata Kubernetes itself uses to match objects together —
that's how a Service's `selector` finds the right Pods. An **annotation** is
metadata for everything _else_: other tools and controllers read it,
Kubernetes core doesn't act on it directly.

Your instructor has already installed one such tool on the shared cluster:
**external-dns**. It watches every Service for one specific annotation key,
and when it finds one, it creates the matching DNS record automatically:

```yaml
metadata:
  annotations:
    external-dns.alpha.kubernetes.io/hostname: <your-name>.alialjaffer.com
```

The front door itself is a small proxy — your instructor's own Caddy image,
built the same way your badge's Dockerfile is, just for one job: hold the
real domain, get the real TLS certificate, and forward everything to your
badge's Service by name. Two environment variables configure it, the same
substitution pattern already in your Caddyfile from Day 2:

```
{$SITE_ADDRESS:localhost}          # your real subdomain
reverse_proxy {$SERVICE_NAME:badge-backend-svc}:80   # which Service to forward to
```

> Your instructor also set DNS-only mode (no Cloudflare proxying) on these
> records, so the real IP is always reachable directly — important for what
> you'll do to it next session.

### Task — Maha's missing subdomain

Maha applied her front-door Service, but ten minutes later
`maha.alialjaffer.com` still doesn't resolve to anything. Here's her YAML:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: caddy-front-door
  namespace: maha-ns
  annotations:
    external-dns.alpha.kubernetes.io/hostname: maha.alialjaffer.com
spec:
  type: ClusterIP # <-- suspect
  selector:
    app: caddy-front-door
  ports:
    - port: 80
      targetPort: 80
    - port: 443
      targetPort: 443
```

```
1. What's wrong with Maha's Service?                     →  ______________________
2. What should spec.type be instead?                      →  ______________________
3. In one sentence, why does external-dns need that?       →  ______________________
```

> _Hint: external-dns can only create a DNS record once the Service actually
> **has** a public IP to point at. Which Service `type` gets one, and which
> doesn't?_

Resources for help:

- [Kubernetes: annotations vs labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/)
- [external-dns project docs](https://github.com/kubernetes-sigs/external-dns)
- Stuck? Ask a teaching assistant during Lab hours. 😊

---

### 🏆 Milestone 9 — Give your badge its own name

**4.1** — Recon yesterday's objects from the terminal:

```bash
kubectl get pods,deployments,services -n <your-namespace>
```

**4.2** — Feel the difference a Deployment makes. Run a throwaway Pod, then
delete it and watch nothing replace it:

```bash
kubectl run scratch --image=nginx --port=80 -n <your-namespace>
kubectl delete pod scratch -n <your-namespace>
```

**4.3** — Clean slate. Today's badge is shaped differently (internal-only,
behind a front door), so remove yesterday's `hello` demo — you won't need it
anymore:

```bash
kubectl delete deployment hello -n <your-namespace>
kubectl delete service hello -n <your-namespace>
```

**4.4** — Rebuild the badge as the backend, then apply it:

```yaml
# badge-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: badge
  namespace: <your-namespace>
spec:
  replicas: 1
  selector:
    matchLabels:
      app: badge
  template:
    metadata:
      labels:
        app: badge
    spec:
      containers:
        - name: badge
          image: <your-dockerhub-username>/cloud-explorer:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 50m
          env:
            - name: SITE_ADDRESS
              value: ":80" # <-- don't change this!
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
```

> _Hint: without `SITE_ADDRESS: ":80"`, badge's own Caddy defaults to
> `localhost` and tries to redirect every request to HTTPS — which breaks the
> front door's `reverse_proxy`, since badge is only ever reached over plain
> HTTP from inside the cluster. The Pod's own name lives at `metadata.name`.
> The `resources.requests.cpu` line is what next session's HPA measures usage
> against — without it, the autoscaler can't compute a percentage at all._

```bash
kubectl apply -f badge-deployment.yaml
kubectl expose deployment badge --port=80 --target-port=80 -n <your-namespace>
```

**4.5** — Stand up the front door. Fill in your subdomain, then apply:

```yaml
# front-door.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: caddy-front-door
  namespace: <your-namespace>
spec:
  replicas: 1
  selector:
    matchLabels:
      app: caddy-front-door
  template:
    metadata:
      labels:
        app: caddy-front-door
    spec:
      containers:
        - name: caddy
          image: alialjaffer/caddy:latest
          env:
            - name: SITE_ADDRESS
              value: <your-name>.alialjaffer.com
            - name: SERVICE_NAME
              value: badge
          ports:
            - containerPort: 80
            - containerPort: 443
---
apiVersion: v1
kind: Service
metadata:
  name: caddy-front-door
  namespace: <your-namespace>
  annotations:
    external-dns.alpha.kubernetes.io/hostname: <your-name>.alialjaffer.com
spec:
  type: LoadBalancer
  selector:
    app: caddy-front-door
  ports:
    - name: http
      port: 80
      targetPort: 80
    - name: https
      port: 443
      targetPort: 443
```

```bash
kubectl apply -f front-door.yaml
```

**4.6** — Wait a minute for DNS and the certificate, then visit
`https://<your-name>.alialjaffer.com`. Real padlock, real name — and near the
top of the badge, a line reading `served by pod: badge-xxxxxxxxxx-xxxxx`.

Downloadable starters, blanks included:

- [badge-deployment.yaml](../public/day5-badge-deployment.yaml)
- [front-door.yaml](../public/day5-front-door.yaml)

**Wrap-up question:** the front door's Service carries the
`external-dns.alpha.kubernetes.io/hostname` annotation and is pinned at 1
replica. The badge Deployment has neither. In one sentence, why does only one
of the two ever need to change?

### ✅ You have finished Milestone 9 when

- You ran a bare Pod with `kubectl run`, then watched it _not_ come back
  after you deleted it
- Your badge is live at your own real subdomain, with a genuine TLS
  certificate
- The badge page shows the actual name of the Pod serving it
- You can explain, in one sentence, the difference between a label and an
  annotation

### 🌥️ Fallback

No cloud tenant, or your kubeconfig isn't working? Complete the fill-in task
in section 4 on paper, and walk through the Kahoot for this session — the
terminal steps are worth seeing live in class or with a partner who has
access.

---

# Session 2 · Autoscaling: survive the class-wide load test

> Sections 1 to 4 are the morning, and they end at Milestone 9. Your badge
> should already be live at its own subdomain before you start here.

## 5. Manual scaling: you're the thermostat

You already scaled by clicking a button on Day 4. Same thing, typed.

**5.1** — Scale it by hand, and watch:

```bash
kubectl scale deployment badge --replicas=5 -n <your-namespace>
kubectl get pods -n <your-namespace> --watch
```

This works, but _you_ have to notice the traffic and type the command every
time. That's the gap **HPA** fills next.

---

## 6. HPA: let the cluster be the thermostat

A **HorizontalPodAutoscaler (HPA)** watches a Deployment's resource usage and
adjusts `replicas` for you — the self-healing idea from Day 4, aimed at load
instead of crashes.

**6.1** — Turn it on:

```bash
kubectl autoscale deployment badge --cpu-percent=50 --min=1 --max=10 -n <your-namespace>
kubectl get hpa -n <your-namespace> --watch
```

**6.2** — One prerequisite: HPA measures usage as a **percentage of what a
Pod asked for**. Milestone 9's `badge-deployment.yaml` already set this to
`50m` — confirm it, or set it again if you're not sure:

```bash
kubectl set resources deployment badge --requests=cpu=50m -n <your-namespace>
```

> We're setting that request artificially low on purpose — it makes the
> autoscaler easy to trigger live in class. A real production service would
> size this from actual measured usage, not a round number picked for a demo.

---

## 7. Tuning how fast it reacts

By default, HPA scales **up** almost instantly but scales **down** slowly —
a built-in 5-minute cooldown (`stabilizationWindowSeconds: 300`) so it
doesn't yo-yo replicas up and down on every small blip. Great for production,
frustrating for a live demo where you want to _see_ it happen both ways.

You override this per-HPA with a `behavior` block — no cluster-admin access
needed, just YAML:

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0
    policies:
      - type: Percent
        value: 100
        periodSeconds: 15
  scaleDown:
    stabilizationWindowSeconds: 15
    policies:
      - type: Percent
        value: 50
        periodSeconds: 15
```

`kubectl autoscale` can't set this — it only takes `--min`/`--max`/
`--cpu-percent`. To add `behavior`, you `apply` a full HPA YAML over the one
you already created; same name, same object, updated spec.

### Task — Badr's sluggish scale-down

Badr's HPA scales up fine under load, but ten minutes after the load test
ends, he's still sitting at 8 replicas. Here's his `behavior` block:

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0
    policies:
      - type: Percent
        value: 100
        periodSeconds: 15
  scaleDown:
    policies:
      - type: Percent
        value: 50
        periodSeconds: 15
```

```
1. What's missing from Badr's scaleDown block?              →  ______________________
2. What value should it have, to match the tuned example?     →  ______________________
3. What does Kubernetes use when that field is left out?       →  ______________________
```

> _Hint: compare his numbers to the default Kubernetes ships with (5 minutes)
> and to the tuned example above. Which field is he missing?_

Resources for help:

- [Kubernetes: HPA scaling policies](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#configurable-scaling-behavior)
- Stuck? Ask a teaching assistant during Lab hours. 😊

---

## 8. The class-wide load-test showdown

### 🏆 Milestone 10 — The class-wide load-test showdown

**8.1** — Reset to a clean baseline:

```bash
kubectl scale deployment badge --replicas=1 -n <your-namespace>
kubectl set resources deployment badge --requests=cpu=50m -n <your-namespace>
```

**8.2** — Turn on autoscaling:

```bash
kubectl autoscale deployment badge --cpu-percent=50 --min=1 --max=10 -n <your-namespace>
```

**8.3** — Tune it to react fast both ways. Fill in the blank from the Task
above, then apply your own `hpa.yaml` with the full `behavior` block from
section 7:

[hpa.yaml](../public/day5-hpa.yaml)

```bash
kubectl apply -f hpa.yaml
```

**8.4** — Make sure `hey` is installed, and confirm it can reach your
subdomain from last session:

```bash
hey -z 10s -c 5 https://<your-name>.alialjaffer.com/
```

**8.5** — On your instructor's go, run the real test with everyone else at
once:

```bash
hey -z 90s -c 100 https://<your-name>.alialjaffer.com/
```

**8.6** — Watch it happen live, in a second terminal:

```bash
kubectl get hpa -n <your-namespace> --watch
kubectl top pods -n <your-namespace>
```

**8.7** — Bonus round, while the test is still running:

- `kubectl exec -it <a-pod-name> -n <your-namespace> -- top` — watch CPU
  climb from _inside_ one of the Pods.
- `kubectl delete pod <a-pod-name> -n <your-namespace>` — watch self-healing
  and autoscaling happen at the same time.

**8.8** — Refresh your badge a few times during and after the test — watch
the `served by pod:` line change as you land on different replicas.

> _Hint: `hey -z 90s -c 100` means "run for 90 seconds, 100 requests in
> flight at once." Point it at the real subdomain you stood up last
> session — the request has to survive DNS, the front door, and the
> load-balanced backend, same as any real visitor._

### ✅ You have finished Milestone 10 when

- Your HPA scaled `badge` up under load and back down within roughly 15-30
  seconds of the load ending
- You watched `kubectl get hpa --watch` and `kubectl top pods` move live
  during the class-wide test
- You saw the pod name on your badge change between refreshes
- You can explain why HPA needs a CPU request set before it can compute a
  percentage

### 🌥️ Fallback

No cloud tenant, or the shared cluster is unavailable? Complete the fill-in
task in section 7 on paper, and watch the class-wide test from a partner's
screen — the moment of everyone's HPA reacting at once is worth seeing live.

---

### 🎁 Bonus — automate future redeploys (optional, not graded)

Day 2 automated redeploys to your VM on every push. This does the same for
your Kubernetes badge. It's optional, and only useful while your Deployment
from Milestone 9 still exists — do this **before** Clean up below, not after.

**1.** Pull in the workflow file, using the same trick from Setup:

```bash
git checkout upstream/main -- .github/workflows/k8s-deploy.yml
git commit -m "Pull in automated Kubernetes deploy workflow"
git push
```

**2.** Open `.github/workflows/k8s-deploy.yml` and fill in the three blanks
under `env:`:

```yaml
env:
  K8S_DEPLOYMENT: <your-deployment-name> # <-- badge
  K8S_NAMESPACE: <your-namespace-name> # <-- your namespace from Day 4
  DOCKERHUB_IMAGE: <your-dockerhub-image-name> # <-- the repo name you pushed to in Day 2, not always "cloud-explorer"
```

> Check your own Docker Hub repo for the exact image name you pushed to back
> in Day 2 — not everyone named it `cloud-explorer`.

**3.** Add one repository secret (GitHub repo → **Settings** → **Secrets and
variables** → **Actions** → **New repository secret**):

| Secret       | Value                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| `KUBECONFIG` | your kubeconfig file's contents, base64-encoded: `cat <path-to-your-kubeconfig> \| base64` |

`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are already set from Day 2 —
nothing new there. `K8S_DEPLOYMENT`/`K8S_NAMESPACE` aren't secret values, so
they live directly in the workflow file instead.

**4.** Commit and push your filled-in workflow file.

**5.** Push any change (tweak a color in `config.ts` again) and watch the
**Actions** tab. It builds a new image tagged with the commit SHA, then
patches your `badge` Deployment to use it — no `kubectl apply` by hand.
Refresh your badge and watch `served by pod:` change to a fresh Pod running
the new image.

> Why a commit SHA tag instead of `:latest`? Kubernetes only rolls out a new
> Pod when the image _reference_ changes. Re-pushing `:latest` with the same
> tag name doesn't trigger anything — a unique SHA tag on every push
> guarantees a real rollout every time.

---

## 🧹 Clean up (important!)

Cloud resources bill while they exist. Once you're done presenting:

```
[ ] Delete this session's objects:
    kubectl delete deployment badge caddy-front-door -n <your-namespace>
    kubectl delete service badge caddy-front-door -n <your-namespace>
    kubectl delete hpa badge -n <your-namespace>
[ ] Delete your namespace entirely (removes anything left over):
    kubectl delete namespace <your-namespace>
[ ] Stop/release your ECS instance and EIP (Day 1)
[ ] Delete your OSS bucket, or keep it if it's within the free tier (Day 4)
```

Your **GitHub repo stays** — it's your portfolio piece. Keep it.

### Where to go next

Curious and want more after this week? Natural next steps:

- **Ingress, ConfigMaps & Secrets** — the rest of Kubernetes' everyday object
  set.
- **Infrastructure as Code (Terraform)** — create clusters and VPCs with code
  instead of clicking.
- **GitOps** — deploy to Kubernetes by pushing YAML to Git instead of running
  kubectl by hand.
- **Certifications** — Alibaba ACA is a great match for what you just did.

These are exactly the topics AZM's longer Platform Engineering track covers.
Ask if you want to go further. 🚀
