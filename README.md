# restroid-boss-web (RestroidBOSS)

Restroid sahibi mobil UI — Next.js App Router SPA. Flutter `RestroidBoss` uygulaması bunu WebView içinde açar.

## Dev

```bash
pnpm install
pnpm dev   # http://0.0.0.0:3010
```

Flutter (emulator):

```bash
flutter run --dart-define=BOSS_WEB_BASE=http://10.0.2.2:3010
```

## Env

See `.env.example` — `NEXT_PUBLIC_BOSS_API_BASE` (default `https://cloud.restroid.com`).

Browser calls go to `/panel-api/*` (Next rewrite → cloud). Flutter injects `window.__RESTROID_BOSS__` (token, branchCode, …).

## Gaps for v0

See [V0_GAPS.md](./V0_GAPS.md).
