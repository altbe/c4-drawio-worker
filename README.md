# C4-PlantUML to draw.io Worker

A Cloudflare Worker that converts C4 PlantUML diagrams to draw.io format.

## Features

- Web UI for interactive diagram conversion
- REST API for programmatic access
- Download generated .drawio files
- Configurable layout options
- CORS support for cross-origin requests

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Open http://localhost:8787
```

## Deployment

### First-time setup

```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npm run deploy
```

### Production deployment

```bash
npm run deploy:prod
```

## API Reference

### GET /

Web UI for interactive conversion.

### GET /health

Health check endpoint.

**Response:**
```json
{"status": "ok", "version": "1.0.0"}
```

### POST /convert

Convert PlantUML to draw.io XML.

**Request:**
```bash
curl -X POST https://your-worker.workers.dev/convert \
  -H "Content-Type: text/plain" \
  -d '@startuml
Person(user, "User")
System(sys, "System")
Rel(user, sys, "Uses")
@enduml'
```

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `direction` | `TB` | Layout: TB, LR, BT, RL |
| `nodesep` | `60` | Horizontal node spacing |
| `ranksep` | `80` | Vertical rank spacing |

**Response:** `application/xml` with `Content-Disposition: attachment`

## Configuration

Edit `wrangler.toml`:

```toml
[vars]
MAX_INPUT_SIZE = "102400"  # Max input size in bytes
CORS_ORIGIN = "*"          # Allowed CORS origin
```

## Architecture

```
┌──────────┐     ┌─────────────────────┐     ┌──────────┐
│  Browser │────▶│  Cloudflare Worker  │────▶│ draw.io  │
│  (PlantUML)    │  c4-puml-to-drawio  │     │   XML    │
└──────────┘     └─────────────────────┘     └──────────┘
```

## Dependencies

- [@altbe/c4-puml-to-drawio](https://github.com/altbe/c4-puml-to-drawio) - Core conversion library
- [wrangler](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare CLI

## License

MIT
