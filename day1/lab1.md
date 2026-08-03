# Lab 1 — Launch a server, then take the wheel

**Majal Initiative · Cloud Computing Bootcamp**

| | |
|---|---|
| **Duration** | A full day, across two sessions |
| **Environment** | Alibaba Cloud console + a terminal on your own laptop |
| **Level** | Beginner |
| **Format** | Two milestones and two tasks, each with a hint |

## Objectives

By the end of this lab you will have launched a real virtual machine in a real
data centre, given it a public address, connected to it over SSH from your own
laptop, and written a small script that runs *on the server* and reports on
itself. The server you build here is the one every other day of this week
deploys onto — do not delete it.

## Setup

You need three things before you start: an **Alibaba Cloud console login** (your
instructor invited you), a **terminal**, and somewhere safe to keep a downloaded
key file.

- **macOS / Linux:** use the built-in Terminal.
- **Windows:** install **MobaXterm**. It handles the key file for you and saves
  you a fight with file permissions. Everything after the connection step is
  identical.

> **How to use this lab:** read each task, try to build the answer yourself, and
> open the hint only if you need a nudge. The point is to *derive* it, not to
> copy it.

> **This costs real money and is really on the internet.** One small server for
> the whole week. Do not spin up extras, and follow Friday's cleanup steps.

---

## 1. Launch your first server

Console layouts differ between tenants and change over time. The steps below name
*what* to do; follow your instructor's live screen for exactly where the buttons
are today.

**1.1** — Create your **SSH key pair before you start the instance wizard**, and
download the `.pem` file somewhere you will not lose it.

> *Hint: ECS → Network & Security → Key Pairs → Create Key Pair. You can only
> download this file once — there is no second chance and no reset.*

**1.2** — Move the downloaded key somewhere sensible and lock it down so only you
can read it.

```bash
mv ~/Downloads/______.pem ~/my-key.pem   # fill in the name you gave your key
chmod 400 ~/my-key.pem
```

> *Hint: on Windows with MobaXterm you skip this — point the session at the .pem
> file instead. You will find out exactly what 400 means in section 4.*

**1.3** — Create the instance. Match these settings exactly, or the rest of the
week stops lining up:

| Setting | Value |
|---|---|
| Billing | Pay-As-You-Go |
| Instance type | the small one your instructor names (2 vCPU / 4 GB) |
| Image | **Ubuntu 22.04 LTS** |
| Network → public IP | tick **Assign Public IPv4 Address**, pay by traffic, 200 Mbps |
| Logon credentials | **root** (not `ecs-user`) |
| Key pair | the one you made in 1.1 |
| Instance name | something unique to you — you are in a shared tenant |
| Security group | the default is fine today |

> *Hint: the public IP tickbox IS your EIP. There is no separate "create an EIP"
> step afterwards.*

**1.4** — Launch it, wait for the state to read **Running**, and write down the
public IP. You will paste it constantly this week.

```bash
ping <your-EIP>
```

> *Hint: if ping times out, that is fine — plenty of firewalls drop ping. Running
> plus a public IP is the real success condition. The proof is SSH, in section 3.*

**Wrap-up question:** your instance is running and healthy but nobody on the
internet can reach it. Name two different settings that could cause that, and say
which one you would check first.

---

## 2. Sorting Salem's startup stack

Your friend Salem is launching a startup and keeps bragging about all the "cloud"
tools he uses — but he is fuzzy on what he actually manages versus what the
provider manages for him.

**2.1** — Label each item **IaaS**, **PaaS** or **SaaS**.

```text
1. A bare Ubuntu virtual machine he installs his code on   →  ______
2. Gmail, which his whole team uses for email              →  ______
3. A managed database he just connects to (no OS to patch) →  ______
4. Salesforce, which his sales team logs into              →  ______
5. An ECS instance (like the one you just launched)        →  ______
```

> *Hint: ask "do I manage the operating system?" Yes → probably IaaS. "Do I just
> log in and use finished software?" → SaaS. Something in between, a managed
> service you build on → PaaS.*

**Wrap-up question:** two items on that list get the same answer. Which two, and
why does that surprise people?

---

# Session 2 · Operating your server

> Sections 1 and 2 are the morning. Everything from here on is the afternoon
> session — you should have a running server with a public address before you
> start it.

## 3. Connect to your server

**3.1** — Connect from your laptop. **macOS/Linux:** run this in **Terminal**
(screenshot: [Terminal SSH](../guides/ssh.png)). **Windows:** run it in **Git
Bash** exactly as shown below, or use **MobaXterm** instead (screenshot
walkthrough: [MobaXterm SSH setup](../guides/MobaXterm.png)):

```bash
ssh -i ~/my-key.pem root@<your-EIP>
```

> *Hint: `-i` means "identify me with this private key file". The first time it
> asks whether to trust the server — type `yes`. You are in when the prompt turns
> into something like `root@iZ...:~#`.*

**3.2** — Prove to yourself where you actually are. Run all four, and read the
answers.

```bash
pwd
hostname
whoami
cat /etc/os-release | grep PRETTY_NAME
```

> *Hint: `hostname` is the interesting one — compare it to your laptop's. If it
> matches your laptop, you are not on the server.*

**3.3** — Make a working area you will reuse tomorrow.

```bash
mkdir day1 && cd day1
```

**Wrap-up question:** the prompt changed when you connected. Whose computer is
now running the commands you type, and how would you prove it to someone who did
not believe you?

---

## 4. Permissions — why the key needed `chmod 400`

Every file carries ten characters describing who may do what to it.

```text
-rw-r--r--  1 root root  220 Jul  5 10:00 notes.txt

 -   rw-   r--   r--
type owner group others
```

Each group of three is **r**ead (4), **w**rite (2), e**x**ecute (1), and `chmod`
takes the sum for each group.

**4.1** — On the server, create a file and look at its default permissions, then
change them and look again.

```bash
echo "hello" > test.txt
ls -l test.txt
chmod 400 test.txt
ls -l test.txt
```

> *Hint: watch which letters disappear. 4+0+0 means owner-read, and nothing at
> all for group or others.*

**4.2** — Explain, in one sentence, why SSH refuses to use a private key whose
mode is `644`.

> *Hint: 644 means group and others can read the file. Think about who else might
> have an account on the machine holding your key.*

**Wrap-up question:** a private key must **not** be executable, but a script
**must** be. Why does the same `x` bit matter in opposite directions?

---

## 5. Write `report.sh`

Your classmate Reem keeps losing track of which server she is logged into and
what state it is in. Write her a script that prints a tidy report. This one task
uses variables, `$1`, redirection and a pipe all together.

**5.1** — Create the file on the **server** (not on your laptop) and fill in every
blank.

```bash
#!/bin/bash
# report.sh - usage: ./report.sh "<your name>"

export OWNER="____"                 # read the first argument into OWNER

echo "=== Server report ==="  ____  report.txt   # start the file (overwrite)
echo "Owner:  $OWNER"         ____  report.txt   # append
echo "Host:   $(hostname)"    >>    report.txt
echo "When:   $( ____ )"      >>    report.txt   # today's date and time
echo "Uptime: $(uptime -p)"   >>    report.txt

echo "Report saved for $OWNER!"
cat report.txt | grep ____                       # pull just the Owner line back out
```

> *Hint: create it with `nano report.sh`; save with `Ctrl+O`, `Enter`, `Ctrl+X`.
> Start the file with a single `>` and append every line after it with `>>`.
> `$(command)` runs a command and drops its output straight into your text.*

**5.2** — Make it runnable and run it.

```bash
chmod +x report.sh
./report.sh "Reem"
cat report.txt
```

> *Hint: if you get `Permission denied`, you skipped the `chmod +x`. If the file
> only has one line in it, you used `>` where you needed `>>`.*

**Wrap-up question:** run the script twice in a row. Does `report.txt` grow, or
stay the same size? Explain what that tells you about the first `>`.

---

## 6. Finish line

You are done when all of these are true:

- Your instance shows **Running** and has a **public IP** you have written down.
- Your `.pem` key file is saved and `chmod 400` has been applied to it.
- You can connect over SSH and move around the filesystem confidently.
- `report.sh` runs, builds `report.txt` with `>` then `>>`, injects `$(date)`,
  and pulls the owner line back out with a pipe.

Stuck at any point? `man chmod` and `man grep` are on the server (press `q` to
quit a manual page), and a teaching assistant is available during lab hours.

**Leave the server running.** Tomorrow you put your app in a container and deploy
it onto this exact machine.

### Before Day 2

On macOS, follow the
[Docker Desktop setup guide](../guides/docker-desktop-setup-macos.pdf) to
install **Docker Desktop** tonight from
[docker.com](https://www.docker.com/products/docker-desktop/) — it downloads
slowly, and Day 2's lab assumes it is already running.
