# api-load-test — implementation reference

Source revision: `9b5223fbcdf7df3b36c4cdb45892538c7bf8033f`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/package.json) declares `index.js`. Node.js `>=18` and npm.

Executable mapping: `api-load-test` → `./index.js`, `alt` → `./index.js`.

## Supported workflow

Count or duration runs; concurrency and ramp-up controls; configurable requests; percentile latency and output reports.

Results depend on the load-generator host and network and are not a distributed capacity benchmark. Each run sends real traffic; use an endpoint you control.

## Command reference

The commands below use the installed executable name. From the pinned checkout, replace it with the `node` entrypoint shown above. Options and command branches were cross-checked against captured source; examples are not execution transcripts.

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

## Package scripts

| Script | Exact command |
| --- | --- |
| `test` | `node --test` |

## Implementation sources

[index.js](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.
