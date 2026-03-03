# api-load-test

> Simple HTTP load testing. p50/p95/p99 latency, throughput, error rates. Zero dependencies.

## Install

```bash
# Run directly with npx (no install needed)
npx api-load-test <url> [options]

# Or install globally
npm install -g api-load-test
```

## Quick Start

```
  api-load-test v1.0.0
  https://api.example.com/health
  GET · 100 requests · 10 concurrent

  [██████████████████████████████] 100/100 100%  312 rps

─── Results ──────────────────────────────────────

  Requests
    Total:        100
    Success:      98  (98.0%)
    Errors:       2   (2.0%)
    Duration:     1842ms

  Latency
    Min:          18ms
    Mean:         87ms
    p50:          72ms
    p95:          243ms
    p99:          401ms
    Max:          512ms

  Throughput
    54.3 req/sec

  Status Codes
    200: 98
    500: 2

  Slowest 5
    512ms  500
    401ms  500
    389ms  200
    312ms  200
    298ms  200

  Latency Distribution
      18ms -     68ms │ ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 51
      68ms -    118ms │ ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇       32
     118ms -    168ms │ ▇▇▇▇▇▇▇                9
     168ms -    218ms │ ▇▇▇                    4
     218ms -    268ms │ ▇▇                     2
     268ms -    318ms │ ▇                      1
     318ms -    512ms │ ▇                      1

──────────────────────────────────────────────────
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--requests, -n <N>` | `100` | Total number of requests |
| `--duration, -d <T>` | — | Run for duration (e.g. `30s`, `2m`) |
| `--concurrency, -c <N>` | `10` | Concurrent requests |
| `--method, -m <METHOD>` | `GET` | HTTP method |
| `--body, -b <JSON>` | — | Request body |
| `--header, -H <K:V>` | — | Request header (repeatable) |
| `--auth <TOKEN>` | — | Authorization header (`$ENV_VAR` reads from env) |
| `--timeout, -t <MS>` | `5000` | Per-request timeout in ms |
| `--ramp-up <T>` | — | Gradually increase concurrency over duration |
| `--format, -f <text\|json>` | `text` | Output format |
| `--output, -o <FILE>` | — | Save JSON report to file |

## Examples

```bash
# Basic — 100 requests, 10 concurrent
alt https://api.example.com/health

# Duration mode — hammer for 30 seconds
alt https://api.example.com/health --duration 30s --concurrency 20

# POST with body and headers
alt https://api.example.com/users \
  --method POST \
  --body '{"name":"test"}' \
  --header "Content-Type: application/json" \
  --header "X-API-Key: mykey"

# Auth from environment variable (never hardcode tokens)
MY_TOKEN=secret alt https://api.example.com/protected --auth '$MY_TOKEN'

# Machine-readable output
alt https://api.example.com --requests 500 --format json --output report.json

# Ramp up concurrency over 10 seconds
alt https://api.example.com --duration 60s --concurrency 50 --ramp-up 10s
```

## Output

### Real-time
Live progress bar showing requests completed, percentage, and current requests/sec.

### Final Report
- **Requests**: total, success, error counts + rates
- **Latency**: min, mean, p50, p95, p99, max (all in ms)
- **Throughput**: sustained requests/sec
- **Status codes**: breakdown of every HTTP status code seen
- **Slowest 5**: the 5 slowest individual requests
- **Histogram**: ASCII latency distribution across 10 buckets

### JSON output (`--format json`)
```json
{
  "url": "https://api.example.com/health",
  "options": { "method": "GET", "concurrency": 10, "requests": 100 },
  "stats": {
    "total": 100,
    "success": 98,
    "errors": 2,
    "errorRate": 2.0,
    "latency": { "min": 18, "mean": 87, "p50": 72, "p95": 243, "p99": 401, "max": 512 },
    "throughput": 54.3,
    "statusCodes": { "200": 98, "500": 2 }
  }
}
```

## Why?

Most load testing tools (k6, wrk, ab) need installing, configuring, or learning a DSL. `api-load-test` is a single file you can run instantly with `npx`. No installs, no config files, no dependencies — just fire requests and get percentiles.

Good for:
- Quick API health checks under load
- Pre-deploy smoke tests
- Comparing before/after performance of a code change
- CI/CD load assertions

## Security

- Never hardcode tokens. Use `--auth '$ENV_VAR_NAME'` to read from environment.
- The tool never logs, prints, or stores authorization header values.

## License

MIT

---

Built with Node.js · Zero dependencies · MIT License
