# Portwacht-noti

Get a push notification on your phone whenever the overall progress on [PortWatch VI](https://portwatch-vi.xyz/) changes.

```
PortWatch VI: jetzt 92.1%
91.3% → 92.1% (+0.8)
Leader: Belobug
```

*(Notification text is in German; edit the strings in `watch.mjs` if you want another language.)*

Runs for free on GitHub Actions and sends notifications through [ntfy](https://ntfy.sh). You don't need a server or an account, and your PC can be off.

> Unofficial fan project, not affiliated with PortWatch VI. All data comes from the public site.

---

## Just want the notifications?

You don't have to set anything up. This repo already pushes to the ntfy topic **`portwatch-vi`**:

1. Install the **ntfy** app ([iOS](https://apps.apple.com/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)), or open [ntfy.sh/portwatch-vi](https://ntfy.sh/portwatch-vi) in your browser.
2. Tap **+** and subscribe to the topic `portwatch-vi` on the default server (ntfy.sh).
3. Allow notifications. You're done.

---

## Run your own copy

### 1. Fork this repo
Click **Fork** at the top right.

### 2. Pick your own topic
Open `.github/workflows/watch.yml` and change the topic name:

```yaml
env:
  NTFY_TOPIC: portwatch-vi   # ← change this, e.g. portwatch-vi-yourname-x7k2
```

Please use your own topic. If you keep `portwatch-vi`, everyone subscribed to it gets duplicate pushes. ntfy topics are public, so pick something hard to guess.

### 3. Allow the workflow to save its state
Go to **Settings → Actions → General → Workflow permissions**, select **Read and write permissions**, then click **Save**.

### 4. Enable Actions
Forks have scheduled workflows turned off by default. Open the **Actions** tab and click **I understand my workflows, go ahead and enable them**.

### 5. Start it once
Go to **Actions → PortWatch -> ntfy → Run workflow**. After a few seconds you should see a green check mark, and `state.json` updates with the current score.

### 6. Subscribe on your phone
In the ntfy app, subscribe to the topic you picked in step 2.

From now on the check runs every 10 minutes by itself.

---

## How it works

- Every 10 minutes GitHub runs `watch.mjs`.
- The script downloads the site's public data (`/data/tracker.json`) and the site's own scoring code (`/assets/js/scoring.js`). That way the number is always the same as the one on the website, even if the scoring rules change.
- It compares the result with the last saved value in `state.json`.
  - **Same:** nothing happens.
  - **Different:** it sends a push to ntfy and commits the new value to `state.json`.
- When the score goes up, the push has high priority. When the leader changes, the push names the previous leader too. Tapping the notification opens the site.

## Test the notification

Edit `state.json`, change `"score"` to something else (e.g. `90`), commit, then run the workflow manually. You should get a push right away, and the file updates itself back to the real value.

## Good to know

- **Free:** GitHub Actions is free for public repos, and ntfy.sh is free.
- **Delays:** GitHub sometimes starts scheduled runs a few minutes late. The site only updates its data roughly every 3 hours, so this doesn't matter.
- **60-day rule:** if a repo has no activity for 60 days, GitHub pauses its scheduled workflows and emails you. To restart it, click **Enable workflow** in the Actions tab.
- **Change the interval:** edit the `cron` line in `watch.yml`, e.g. `'*/30 * * * *'` for every 30 minutes.

## Run it locally (optional)

Requires Node.js 18 or newer:

```bash
NTFY_TOPIC=your-topic node watch.mjs
DRY_RUN=1 node watch.mjs   # prints the message instead of sending it
```

## Credits

Data and scoring: [PortWatch VI](https://portwatch-vi.xyz/) ([GitHub](https://github.com/4lwayz/portwatch-vi)). Notifications: [ntfy](https://ntfy.sh).
