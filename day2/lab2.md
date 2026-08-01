# Lab 2 — Build it, deploy it, then never do that again

**Majal Initiative · Cloud Computing Bootcamp**

| | |
|---|---|
| **Duration** | A full day, across two sessions |
| **Environment** | Your laptop (VS Code + Docker Desktop) and yesterday's server |
| **Level** | Beginner |
| **Format** | Two milestones and three fill-in tasks, each with a hint |

## Objectives

By the end of this lab your own web app will be live on the internet, on the
server you built yesterday, over HTTPS with a trusted padlock — and pushing a
one-line change to GitHub will redeploy it without you touching the server at
all. You will have written a Dockerfile, published an image to a registry, and
built a CI/CD pipeline.

## Setup

You need four things before you start: your **server from Day 1** still running,
**VS Code**, **Docker Desktop** running on your laptop, and a **GitHub account**
you are signed into.

> **How to use this lab:** read each task, try to build the answer yourself, and
> open the hint only if you need a nudge. The point is to *derive* it, not to
> copy it.

> **The server from yesterday is the target for everything today.** Do not create
> a second one. If you deleted yesterday's, launch a replacement now with the same
> settings before you go any further.

---

## 1. Fork the starter, then clone your fork

**1.1** — Open the starter project on GitHub and click **Fork** → **Create fork**.
This makes a complete copy of the project *under your own account*.

**1.2** — In VS Code, press `Ctrl/Cmd + Shift + P`, type **Git: Clone**, and paste
**your fork's** URL — the one with *your* username in it. Pick a folder, and say
yes when VS Code offers to open it.

> *Hint: if you clone the original instead of your fork, everything works right up
> until your first push, which GitHub refuses — you have no write access to
> someone else's repository. The fix is to start again from 1.1, so it is worth
> checking the URL now.*

**1.3** — Open a terminal inside VS Code (**Terminal → New Terminal**) and run the
project locally:

```bash
npm install
npm run dev
```

`Ctrl/Cmd + Click` the `http://localhost:5173` link it prints. That is your badge.
The photo booth works here because browsers treat `localhost` as secure.

---

## 2. Make the badge yours, then push it

**2.1** — Open `src/App.tsx`. At the very top is the `CONFIG` block — the only
part you need to touch. Change the name, the fun fact and the colours to your own,
and save. The browser updates instantly.

**2.2** — Push it to your fork, without using the terminal:

1. Click the **Source Control** icon in the left sidebar.
2. Type a short message — `Make the badge mine` — and click **✓ Commit**.
3. Click **Sync Changes**. The first time, VS Code asks you to sign in to GitHub
   in the browser; approve it.

> *Hint: **✓ Commit** is `git add` and `git commit` in one click. **Sync Changes**
> is `git push`. Those are three of the four verbs from the slides.*

**Wrap-up question:** your commit went to your fork, not to the original project.
Why does that matter for what you are about to build this afternoon?

---

## 3. Hisham's mystery container

Hisham installed Docker and started a container someone handed him, and has no
idea what is running inside it. Help him investigate with the commands from the
session.

**3.1** — Fill in the blanks. Run this **on your server**, over SSH — you will
install Docker there in section 4, so come back to this if you are working ahead.

```bash
# 1. Run the official nginx web server, name it "web",
#    map host port 8080 → container port 80
docker run -d --name web -p ____:____ nginx

# 2. List running containers — is "web" there?
docker ____

# 3. Open a shell inside the running container, then look around
docker exec -it web ____
#   (inside)  ls /usr/share/nginx/html
#   (inside)  exit

# 4. Check it serves a page, from the server itself
curl http://localhost:8080

# 5. Clean up
docker stop web && docker rm web
```

> *Hint: `docker run` starts it, `docker ps` lists what is running, and
> `docker exec -it <name> sh` drops you inside. Only one of the two port numbers
> is yours to choose — nginx always listens on 80 inside the image.*

**Wrap-up question:** you never installed nginx on your server. So where did it
come from, and what is left behind on the server after step 5?

---

## 4. Install Docker on your server

### 🏆 Milestone 3 — your project and Docker, on the server

**4.1** — SSH in:

```bash
ssh -i ~/my-key.pem root@<your-EIP>
```

**4.2** — Install Docker and confirm it:

```bash
curl -fsSL https://get.docker.com | sh
docker --version
```

**4.3** — Now complete section 3 right here on the server.

### ✅ You have finished Milestone 3 when

- Your personalised badge is in **your own public GitHub repo**
- `docker --version` works on the server
- You ran, `exec`-ed into, and cleaned up the nginx container

---

## 5. Complete the Dockerfile

The starter project has a `Dockerfile` with the key lines blanked out. Everything
you need, you already learned.

```dockerfile
# ---- Stage 1: build the static site ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN ______                                     # install dependencies cleanly
COPY . .
RUN npm run build                              # produces the site in /app/dist

# ---- Stage 2: serve it over HTTPS with Caddy ----
FROM caddy:2-alpine
COPY --from=______ /app/dist /usr/share/caddy   # copy from WHICH stage?
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE ______ ______                            # the two ports HTTPS needs
```

> *Hint: the clean install command for a project that has a `package-lock.json`
> is `npm ci`. The first stage was given a name — look at the `AS`. And HTTPS
> needs the same two ports you are about to open in the security group.*

**Wrap-up question:** stage 1 installs hundreds of megabytes of build tools. How
much of that ends up on your server, and why?

---

## 6. Build, push, pull, run — by hand

**6.1** — Open ports **80** and **443** in your instance's security group
(Alibaba console → your instance → Security Groups → add inbound rules). Caddy
needs 80 to prove you own the name, and 443 to serve the site. Day 3 explains
what you just did.

**6.2** — Create a free account at `hub.docker.com`, then sign in from **Docker
Desktop** (top right). The CLI reuses that login.

**6.3** — On **your own machine**, build and push:

```bash
docker build --platform linux/amd64 -t <your-dockerhub-username>/cloud-explorer .
docker push ______/cloud-explorer
```

> *Hint: `--platform linux/amd64` matters if you are on an Apple Silicon Mac —
> your laptop builds ARM images by default and your server is x86. Without it the
> container refuses to start on the server with an exec-format error.*

**6.4** — On **your server**, pull it and run it. The site serves at your IP with
the dots turned into dashes, plus `.sslip.io`:

```bash
docker pull <your-dockerhub-username>/cloud-explorer

docker run -d -p 80:80 -p 443:443 \
  -e SITE_ADDRESS=______.sslip.io \
  --name cloud-explorer <your-dockerhub-username>/cloud-explorer
```

**6.5** — Open `https://<your-ip-with-dashes>.sslip.io` in a browser. You should
see your badge, a trusted padlock, and a working photo booth. **Your app is live
on the internet.** 🎉

> *Hint: `-e SITE_ADDRESS=...` sets an environment variable inside the container —
> the same concept from Day 1. Caddy reads it to know which hostname to request a
> certificate for. If the certificate does not appear, port 80 is usually still
> closed.*

---

## 7. Feel the pain, then remove it

**7.1** — Change `gradientColors` in `CONFIG` to different colours. Now get that
one line onto the internet, by hand: commit and push, rebuild the image, push it
to Docker Hub, SSH in, pull, remove the old container, run the new one.

That is seven steps for one line. Do it once, deliberately, so the rest of this
section means something.

**7.2** — Add six repository secrets. In your GitHub repo: **Settings → Secrets
and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security → New Access Token |
| `SSH_HOST` | your server's public IP (the EIP) |
| `SSH_USER` | `root`, or your login user |
| `SSH_KEY` | the contents of your private `.pem` file |
| `SITE_ADDRESS` | your `<ip-with-dashes>.sslip.io` |

> *Hint: Docker Hub shows the access token exactly once. Copy it straight into
> GitHub before you close the tab, or create another one.*

**7.3** — The project has `.github/workflows/deploy.yml` with the important lines
blanked. Fill them in.

```yaml
on:
  push:
    branches: [______]              # which branch triggers a deploy?

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: docker/login-action@v4
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.______ }}    # which secret holds the token?
      - uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/cloud-explorer:latest

  deploy:
    needs: ______                   # this job must wait for which job?
    runs-on: ubuntu-latest
    steps:
      - name: SSH and redeploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            set -e
            docker rm -f cloud-explorer || true
            docker run -d --pull ______ -p 80:80 -p 443:443 \
              -e SITE_ADDRESS=${{ secrets.______ }} \
              --name cloud-explorer ${{ secrets.DOCKERHUB_USERNAME }}/cloud-explorer:latest
```

> *Hint: the trigger is a `push` to `main`. The second job must wait for the first,
> or it deploys an image that does not exist yet. And `--pull` needs the value that
> always fetches the freshest image — without it, `docker run` happily restarts the
> old one and your site silently serves yesterday's code.*

---

## 8. Finish line

### 🏆 Milestone 4 — from "push code" to "it's live", automatically

**8.1** — Commit both completed files, the `Dockerfile` and `deploy.yml`.

**8.2** — Change `gradientColors` again, flip `isOnCloud` to `true`, then commit
and push from VS Code.

**8.3** — Open the **Actions** tab in your repo and watch both jobs run. When they
go green, refresh `https://<your-ip-with-dashes>.sslip.io`.

**New colours. And you did nothing but push.** 🚀

### ✅ You have finished Milestone 4 when

- Your badge is live over HTTPS on your server
- Pushing a change to `main` redeploys it automatically, with a green check in
  the Actions tab

### 🌥️ Fallback

No cloud tenant? You can still complete all three fill-in tasks and build and run
the image locally with Docker Desktop, which proves the whole mechanism.

### Tomorrow

You opened ports 80 and 443 on faith today. Day 3 explains exactly what a port, a
subnet and a security group are — and why your server was reachable at all.
