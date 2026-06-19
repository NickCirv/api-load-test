<div align="center">

# api-load-test

**Fire HTTP load tests from the terminal — p50/p95/p99 latency, throughput, and error rates with zero dependencies.**

[![License: MIT](https://img.shields.io/badge/license-MIT-0B0A09?labelColor=0B0A09&color=555)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-0B0A09?labelColor=0B0A09&color=555)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-0B0A09?labelColor=0B0A09&color=555)](package.json)

</div>

## Install

```bash
npx github:NickCirv/api-load-test <url> [options]
```

## Usage

```bash
# Basic — 100 requests, 10 concurrent
npx github:NickCirv/api-load-test https://api.example.com/health

# Duration mode — hammer for 30 seconds, 20 concurrent
npx github:NickCirv/api-load-test https://api.example.com/health --duration 30s --concurrency 20

# POST with body and auth from environment
MY_TOKEN=secret npx github:NickCirv/api-load-test https://api.example.com/users \
  --method POST \
  --body '{"name":"test"}' \
  --header "Content-Type: application/json" \
  --auth '$MY_TOKEN'

# Machine-readable JSON output
npx github:NickCirv/api-load-test https://api.example.com --requests 500 --format json --output report.json
```

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

## What it does

Sends a configurable burst of HTTP/HTTPS requests and reports latency percentiles (p50, p95, p99), throughput (req/sec), error rates, and a per-status-code breakdown. Outputs a live progress bar during the run and an ASCII latency histogram at the end. Use `--format json` to pipe results into CI assertions or dashboards. Tokens passed via `--auth '$MY_TOKEN'` are read from environment variables and never logged.

---

<sub>Zero dependencies · Node ≥18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
