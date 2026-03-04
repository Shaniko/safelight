# SafeLight Backend

Minimal Node.js + TypeScript + Fastify backend for SafeLight.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The server listens on `http://localhost:3000` by default.

## Build & Run

Build TypeScript into `dist/`:

```bash
npm run build
```

Run the compiled server:

```bash
npm start
```

## Tests

Run the test suite (Vitest):

```bash
npm test
```

## API Endpoints (Phase 0 + Phase 1)

- `GET /v1/health`  
  Returns basic service health:

  ```json
  {
    "status": "ok",
    "now_utc": "2026-01-01T00:00:00.000Z"
  }
  ```

- `GET /v1/regions`  
  Returns curated list of supported cities:

  ```json
  [
    { "region_id": "tel-aviv-yafo", "display_name": "Tel Aviv-Yafo" }
  ]
  ```

- `GET /v1/status?region_id=tel-aviv-yafo`  
  Returns current safety status for a city:

  ```json
  {
    "state": "GREY",
    "display_text": "Information currently unavailable",
    "disclaimer": null,
    "timestamp_utc": "2026-01-01T00:00:00.000Z",
    "data_source_label": "Pikud HaOref official feed (stubbed)"
  }
  ```

If `region_id` is missing or unsupported, the endpoint returns `400` with an error payload.

## Official Data Adapter

The `src/official/officialAdapter.ts` module is currently a **stub**. It does **not** call any real upstream service and always returns:

- no active alerts
- no official releases

This means all regions will resolve to the fail-safe **GREY** state until the adapter is wired to the real Pikud HaOref feed in a later phase.

