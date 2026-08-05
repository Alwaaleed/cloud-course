# Lab 4 — Deploy and scale on Kubernetes

**Majal Initiative · Cloud Computing Bootcamp**

| | |
|---|---|
| **Duration** | Session 2 only — Session 1 is concepts, no hands-on work |
| **Environment** | Alibaba Cloud console — no terminal, no `kubectl` |
| **Level** | Beginner |
| **Format** | One fill-in task and one milestone, with a hint |

## Objectives

By the end of this lab you will have created your own **namespace** on the
class's shared **ACK** (Alibaba Container Service for Kubernetes) cluster,
described a **Deployment** and a **Service** in YAML, and deployed the
`nginxdemos/hello` demo image as multiple Pods behind a public
**LoadBalancer** Service — entirely from the Alibaba console. You will watch
the Service load-balance across your Pods in a browser, scale it up, and
delete a Pod yourself to see Kubernetes bring it back without you touching
anything.

## Setup

You need an **Alibaba Cloud console login** with access to the shared ACK
cluster — your instructor will point you to it — and a **browser**. Nothing
to install: every step today is point-and-click in the console.

> **How to use this lab:** read each task, try to build the answer yourself,
> and open the hint only if you need a nudge. The point is to *derive* it,
> not to copy it.

> **The cluster already exists.** The whole class deploys onto **one shared
> ACK cluster** your instructor provisioned. You are not creating a cluster
> today — only your own **namespace**, a walled-off area inside it, so your
> Pods don't collide with anyone else's.

---

# Session 2 · Deploy and scale on Kubernetes

> Session 1 was concepts only — the problem Kubernetes solves, desired state,
> and the four objects (Pod, Node, Deployment, Service). There's nothing to
> carry forward except being able to name what each of those four does.
> Everything below is hands-on.

## 1. Create your own namespace

**1.1** — Open the ACK cluster your instructor points you to.

**1.2** — Go to **Namespaces and Quotas** → **Create Namespace**.

**1.3** — Give it a name unique to you (your first name or GitHub username
works well) → **OK**.

> *Hint: write this name down exactly. You will paste it into two YAML files
> next, and it must match in both.*

---

## 2. Complete the Deployment & Service YAML

Fill in the blanks so this runs **3 copies** of `nginxdemos/hello` and exposes
them on port **80** through a public **LoadBalancer**.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello
  namespace: ______ # <-- your namespace from step 1.3
spec:
  replicas: ____ # <-- run how many copies?
  selector:
    matchLabels:
      app: hello
  template:
    metadata:
      labels:
        app: hello # <-- this label is what the Service looks for
    spec:
      containers:
        - name: hello
          image: nginxdemos/hello
          ports:
            - containerPort: 80
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: hello
  namespace: ______ # <-- same namespace as above
spec:
  type: ______ # <-- which type gives it a public address?
  selector:
    app: ______ # <-- must match the Pod label above
  ports:
    - port: 80
      targetPort: 80
```

> *Hint: `replicas` is "how many copies" — pick 3. The Service's `selector`
> must match the Pod's `labels` (both say `app: hello`). The type that gives a
> Service a real internet-facing address is `LoadBalancer`.*

**Wrap-up question:** if you left `type` as the default (`ClusterIP`)
instead, would you be able to load the page from your own laptop's browser?
Why or why not?

---

## 3. Deploy it and watch it load-balance

### 🏆 Milestone 8 — deploy, scale, and self-heal `nginxdemos/hello`

**3.1** — **Deployments** → **Create from YAML** → paste your completed
`deployment.yaml`.

**3.2** — **Network → Services** → **Create from YAML** → paste your
completed `service.yaml`.

**3.3** — **Pods** — set the **Namespace** selector at the top to yours.
Confirm 3 `hello` Pods show **Running**.

**3.4** — **Network → Services** — find your `hello` Service and copy its
**external address**.

**3.5** — Visit that address in a browser. You'll land on the
`nginxdemos/hello` page — note the **Server address** and **Server name**
lines; that's the IP and hostname of the exact Pod that answered you.

**3.6** — **Refresh the page 4–5 times.** Watch the **Server address** /
**Server name** lines change. Same Service, same URL — a different Pod
answering each time. That's the Service load-balancing across your 3 Pods,
proven on your own screen.

**3.7** — **Scale it.** Back in **Deployments** (namespace still set to
yours), find `hello` → **Scale** → set replicas to **5**. Watch two new Pods
appear in **Pods**.

**3.8** — **Self-heal it.** In **Pods** (namespace set to yours), click **⋮**
next to any one Pod → **Delete** → type "Confirm Deletion" → **OK**. Watch
the Deployment bring up a replacement within seconds — you deleted a Pod, and
nobody had to redeploy anything.

> *Hint: if the external address doesn't load yet, give it a minute — a real
> load balancer is being provisioned behind the scenes the first time a
> `LoadBalancer` Service is created.*

**Wrap-up question:** after step 3.7, how many total Pods do you have, and
which ones (by name) are new?

### ✅ You have finished Milestone 8 when

- Your own namespace exists, and both YAML files reference it
- `hello` runs as multiple Pods, reachable via the Service's external address
- Refreshing the page shows a different Pod's **Server address** / **Server
  name** at least twice
- You scaled the Deployment to 5 replicas and saw new Pods appear
- You deleted a Pod yourself and watched Kubernetes recreate it

### 🌥️ Fallback

No cloud tenant, or the shared cluster is unavailable? Complete the fill-in
task in section 2 on paper, and walk through the Kahoot for this session —
the console steps are worth seeing live in class or with a partner who has
access.

### Tomorrow

You'll level up your Git workflow with branches and pull requests, add a
build check to your Day 2 pipeline, and start writing the final documentation
for your whole week's deployment.
