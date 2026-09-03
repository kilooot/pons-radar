# Pons Radar

Independent read-only desk for [Pons Family Launchpad](https://www.ponsfamily.com/launchpad) on Robinhood Chain.

Tracks tokens approaching graduation, live buys, newest launches, and graduated names. English UI. No wallet. No custody.

## Stack

- Static frontend in `public/`
- Tiny API proxy in `api/` so the browser can read Pons data
- Local server in `server.js` for development

## Local

```bash
node server.js
```

Open `http://localhost:3000`.

## Publish without sleep (recommended)

Do not keep this on Replit free hosting. Idle Repls sleep.

### 1. Push to GitHub

Create a new GitHub repository, then from this folder:

```bash
git init
git add .
git commit -m "Initial Pons Radar desk"
git branch -M main
git remote add origin https://github.com/YOUR_USER/pons-radar.git
git push -u origin main
```

### 2. Host on Vercel (free, does not sleep like Replit)

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Import the `pons-radar` repository.
3. Leave the defaults and deploy.
4. Vercel serves `public/` as the website and `api/` as serverless routes.

The site stays available even with zero traffic. Serverless functions may cold-start for a second after idle time. That is not the Replit “project asleep” state.

### Alternatives

- Cloudflare Pages + a Worker proxy: also always-on and free.
- Render / Railway free tiers can still idle. Avoid if you want a desk that never sleeps.
- GitHub Pages alone is not enough, because the API proxy must run somewhere.

## Disclaimer

Not affiliated with Pons Labs or Robinhood. Token launches are speculative. This is not financial advice.
