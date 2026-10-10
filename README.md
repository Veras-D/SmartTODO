# SmartTODO 🎲⚡
### ADHD-Tailored Focus Engine & Task Roulette

**SmartTODO** is a desktop focus engine designed specifically for neurodivergent and ADHD brains who get trapped by traditional to-do lists, endless overdue notifications, and Google Keep note graveyards.

---

## 🧠 Why SmartTODO is Different

| Traditional To-Do Apps | SmartTODO |
| :--- | :--- |
| **Endless 50-Item Lists** triggering visual overwhelm and executive paralysis | **The Anti-List HUD**: You only see **ONE** task at a time. |
| **Screaming Red "Overdue" Badges** causing shame and avoidance | **Guilt-Free Adaptive Rerolls**: Skipping is diagnostic, not a failure. |
| **Tasks Blocked by Prerequisites** sitting around cluttering your brain | **Strict Blocker Gating**: Blocked tasks are mathematically excluded from the roulette until unblocked. |
| **High Maintenance Burden** (folders, tags, projects, dates) | **Two-Phase Pipeline**: Instant 1-line capture now, clarify (SMART-ify) only when you have energy. |
| **Task Rot & Abandoned Lists** | **Backlog Bankruptcy**: Single-click fresh start to archive stale tasks to Cold Storage with zero guilt. |

---

## ✨ Core Features

1. **Focus Roulette Engine (`Space` to Roll)**:
   * Randomly selects an unblocked, actionable task from your ready pool.
   * Tactile mechanical dice sound and animation.
   * Energy spoon filters: **All**, **🪫 Low Spoon**, **⚡ Deep Focus**, **⏱️ <10 Mins**.
2. **Adaptive "Can't Do It Now" Reroll (`R`)**:
   * *Too tired / Low Energy*: Automatically switches the session filter to low-effort tasks and rerolls.
   * *Blocked by something*: Prompts for what's missing, marks the task as blocked, and parks it.
   * *Not feeling it right now*: Snoozes until tomorrow without penalty.
   * *Friction Buster*: Temporarily shrinks the task into a 2-minute starter step.
3. **SMART-ify Lounge (Phase 2)**:
   * Clarify captured inbox notes with:
     * **Specific** action verb
     * **Definition of Done** (*"I am finished when [X]"*)
     * **Energy spoons** required (Low / Medium / High)
     * **Micro-steps** deconstruction checklist
     * **Blocker** dependencies
4. **Google Keep / Notes Importer**:
   * Paste any messy multi-line note or checklist from Google Keep.
   * Automatically strips markdown checkboxes, bullets, and numbers into inbox tasks.
5. **Backlog Bankruptcy ("Fresh Start")**:
   * One-click circuit breaker to archive tasks older than 14 days or repeatedly skipped to Cold Storage.
6. **Tactile Micro-Rewards**:
   * Synthesized Web Audio API sound effects (dice rolls, latch clicks, completion fanfare).
   * Confetti celebration on completion.
   * 100% offline, zero external audio asset dependencies.

---

## ⌨️ Keyboard Shortcuts

* <kbd>Space</kbd> &mdash; Roll Next Mission
* <kbd>Enter</kbd> &mdash; Complete Active Task
* <kbd>R</kbd> &mdash; Can't Do It Now (Adaptive Reroll)
* <kbd>N</kbd> &mdash; Quick Brain Dump (Open capture from anywhere)

---

## 🚀 Running the App

### 1. Web / Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:1420](http://localhost:1420) in your browser.

### 2. Standalone Desktop Build (Dockerized, Zero Host Dependencies)
To package a standalone Linux AppImage without requiring any host GTK/WebKit dev packages:
```bash
./build_desktop_docker.sh
```
This builds `SmartTODO_1.0.0_amd64.AppImage` directly in the project root.

---

## 🔒 Privacy & Storage
* All data is stored locally in your browser/desktop storage via JSON.
* Full offline support.
* Single-click **Export JSON** and **Import JSON** in the Archive tab for effortless backups.
