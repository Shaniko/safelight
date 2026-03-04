# SafeLight — Architecture Plan (MVP)

## Goal
Provide a minimal web service that returns the current safety status for a city
based on official Pikud HaOref alerts.

States:
- RED – Active alert
- GREEN – Official release detected
- ORANGE – Media indication only (not implemented in Phase 1)
- GREY – Unknown / data unavailable (fail-safe)

## Architecture Principles

1. Fail-safe first: never show GREEN without official release.
2. Server is source of truth.
3. 10-minute rule handled on server.
4. Regional logic only (city-level in Phase 1).
5. If data is stale or unavailable → GREY.

## System Components

### Ingestion Service
Poll official Pikud HaOref feed and normalize events.

Extract:
- current_alert_active
- last_alert_timestamp
- official_release_detected

Store normalized facts in memory + audit log.

### Status API

Endpoints:

GET /v1/health  
Returns service health status.

GET /v1/regions  
Returns curated list of supported cities.

GET /v1/status?region_id=...  
Returns:

{
  state: RED | GREEN | GREY,
  display_text: string,
  timestamp: ISO string,
  data_source_label: string
}

## State Machine

Inputs:
- current_alert_active
- last_alert_timestamp
- official_release_detected
- data_valid

Logic:

1. If data_valid=false → GREY
2. If alert active → RED
3. If official release detected → GREEN
4. Otherwise → GREY

## Region Strategy (Phase 1)

City-level only.

Initial catalog:
- Tel Aviv-Yafo
- Jerusalem
- Herzliya
- Raanana
- Kfar Saba
- Holon
- Ramat Gan
- Givatayim
- Petah Tikva
- Netanya
- Ashdod
- Ashkelon
- Haifa
- Be'er Sheva

## Implementation Constraints

- Backend: Node.js + TypeScript + Fastify
- Single service (ingestion + API)
- Polling interval: ~15 seconds
- API timestamps: UTC
- No authentication
- No frontend in Phase 1
- Media signals (ORANGE) implemented later