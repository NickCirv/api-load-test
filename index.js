#!/usr/bin/env node
/**
 * api-load-test — Simple HTTP load testing CLI
 * Zero dependencies. Node 18+. ES modules.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import { writeFileSync } from 'fs';
import { performance } from 'perf_hooks';

// ─── ANSI Colors ─────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
};

const isTTY = process.stdout.isTTY;
const color = (c, s) => isTTY ? `${c}${s}${C.reset}` : s;

// ─── Arg Parser ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    url: null,
    requests: null,
    duration: null,
    concurrency: 10,
    method: 'GET',
    body: null,
    headers: [],
    auth: null,
    timeout: 5000,
    rampUp: null,
    format: 'text',
    output: null,
  };

  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (!a.startsWith('-')) {
      opts.url = a;
      i++;
      continue;
    }
    const key = a.replace(/^--?/, '');
    const next = args[i + 1];

    switch (key) {
      case 'requests': case 'n':
        opts.requests = parseInt(next, 10); i += 2; break;
      case 'duration': case 'd':
        opts.duration = parseDuration(next); i += 2; break;
      case 'concurrency': case 'c':
        opts.concurrency = parseInt(next, 10); i += 2; break;
      case 'method': case 'm':
        opts.method = next.toUpperCase(); i += 2; break;
      case 'body': case 'b':
        opts.body = next; i += 2; break;
      case 'header': case 'H':
        opts.headers.push(next); i += 2; break;
      case 'auth':
        opts.auth = next; i += 2; break;
      case 'timeout': case 't':
        opts.timeout = parseInt(next, 10); i += 2; break;
      case 'ramp-up':
        opts.rampUp = parseDuration(next); i += 2; break;
      case 'format': case 'f':
        opts.format = next; i += 2; break;
      case 'output': case 'o':
        opts.output = next; i += 2; break;
      case 'help': case 'h':
        printHelp(); process.exit(0); break;
      default:
        i++;
    }
  }

  return opts;
}

function parseDuration(s) {
  if (!s) return null;
  const match = String(s).match(/^(\d+)(s|m)?$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2] || 's';
  return unit === 'm' ? n * 60000 : n * 1000;
}

function printHelp() {
  console.log(`
${color(C.bold + C.cyan, 'api-load-test')} ${color(C.gray, '— HTTP load testing with latency percentiles')}

${color(C.bold, 'USAGE')}
  alt <url> [options]
  api-load-test <url> [options]

${color(C.bold, 'MODES')}
  --requests, -n  <N>     Fire N total requests (default: 100)
  --duration, -d  <T>     Run for T seconds (e.g. 30s, 2m)
  --concurrency, -c <N>   Concurrent requests (default: 10)

${color(C.bold, 'REQUEST')}
  --method, -m  <METHOD>  HTTP method (default: GET)
  --body, -b    <JSON>    Request body
  --header, -H  <K:V>     Request header (repeatable)
  --auth        <TOKEN>   Authorization header (prefix \$ reads from env)
  --timeout, -t <MS>      Per-request timeout in ms (default: 5000)

${color(C.bold, 'OUTPUT')}
  --ramp-up    <T>        Ramp up concurrency over T seconds
  --format, -f <text|json> Output format (default: text)
  --output, -o <FILE>     Save JSON report to file

${color(C.bold, 'EXAMPLES')}
  alt https://api.example.com/health --requests 100 --concurrency 10
  alt https://api.example.com/users --duration 30s --concurrency 20
  alt https://api.example.com/items --method POST --body '{"key":"val"}' \\
    --header "Content-Type: application/json" --auth "Bearer \$MY_TOKEN"
  alt https://api.example.com --requests 500 --format json --output report.json
`);
}

// ─── HTTP Request ─────────────────────────────────────────────────────────────
function makeRequest(opts, reqHeaders) {
  return new Promise((resolve) => {
    const start = performance.now();
    let parsed;
    try {
      parsed = new URL(opts.url);
    } catch {
      resolve({ ok: false, status: 0, ms: 0, error: 'Invalid URL' });
      return;
    }

    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;

    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: opts.method,
      headers: { ...reqHeaders },
      timeout: opts.timeout,
    };

    const req = transport.request(reqOpts, (res) => {
      // Consume body to free socket
      res.resume();
      res.on('end', () => {
        const ms = performance.now() - start;
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, ms });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const ms = performance.now() - start;
      resolve({ ok: false, status: 0, ms, error: 'TIMEOUT' });
    });

    req.on('error', (err) => {
      const ms = performance.now() - start;
      resolve({ ok: false, status: 0, ms, error: err.code || err.message });
    });

    if (opts.body) {
      req.write(opts.body);
    }

    req.end();
  });
}

// ─── Promise Pool ─────────────────────────────────────────────────────────────
async function runPool({ tasks, concurrency, onResult }) {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const task = tasks[idx++];
      const result = await task();
      onResult(result);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
}

// ─── Duration Mode ────────────────────────────────────────────────────────────
async function runDuration({ durationMs, concurrency, makeReq, onResult, onProgress, rampUp }) {
  const end = Date.now() + durationMs;
  let active = 0;
  let done = 0;
  const results = [];

  const effectiveConcurrency = (t) => {
    if (!rampUp) return concurrency;
    const fraction = Math.min(t / rampUp, 1);
    return Math.max(1, Math.ceil(concurrency * fraction));
  };

  const startTime = Date.now();

  return new Promise((resolve) => {
    const tick = async () => {
      const now = Date.now();
      if (now >= end && active === 0) {
        resolve(results);
        return;
      }

      const elapsed = now - startTime;
      const slots = effectiveConcurrency(elapsed);

      while (active < slots && Date.now() < end) {
        active++;
        makeReq().then((r) => {
          active--;
          done++;
          results.push(r);
          onResult(r, done, null);
          onProgress(done, null, results);
          tick();
        });
      }
    };

    tick();
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function calcStats(results, elapsed) {
  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const n = latencies.length;
  const errors = results.filter((r) => !r.ok);
  const success = results.filter((r) => r.ok);

  const pct = (p) => {
    if (n === 0) return 0;
    const idx = Math.ceil((p / 100) * n) - 1;
    return latencies[Math.max(0, idx)];
  };

  const mean = n > 0 ? latencies.reduce((a, b) => a + b, 0) / n : 0;

  const statusCodes = {};
  for (const r of results) {
    const key = r.status || (r.error ? 'ERR' : '0');
    statusCodes[key] = (statusCodes[key] || 0) + 1;
  }

  const slowest = [...results]
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 5)
    .map((r) => ({ status: r.status, ms: Math.round(r.ms), error: r.error }));

  const throughput = elapsed > 0 ? (n / (elapsed / 1000)) : 0;

  return {
    total: n,
    success: success.length,
    errors: errors.length,
    errorRate: n > 0 ? (errors.length / n) * 100 : 0,
    latency: {
      min: Math.round(latencies[0] || 0),
      mean: Math.round(mean),
      p50: Math.round(pct(50)),
      p95: Math.round(pct(95)),
      p99: Math.round(pct(99)),
      max: Math.round(latencies[n - 1] || 0),
    },
    throughput: Math.round(throughput * 10) / 10,
    statusCodes,
    slowest,
    elapsed: Math.round(elapsed),
    rawLatencies: latencies,
  };
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function renderProgress(done, total, rps) {
  if (!isTTY) return;
  const width = 30;
  const pct = total ? Math.min(done / total, 1) : 0;
  const filled = Math.round(width * pct);
  const bar = color(C.green, '█'.repeat(filled)) + color(C.gray, '░'.repeat(width - filled));
  const pctStr = total ? `${Math.round(pct * 100)}%` : '';
  const countStr = total ? `${done}/${total}` : `${done} reqs`;
  const rpsStr = rps ? ` ${color(C.cyan, rps + ' rps')}` : '';
  process.stdout.write(`\r  [${bar}] ${color(C.bold, countStr)} ${pctStr}${rpsStr}   `);
}

// ─── ASCII Histogram ──────────────────────────────────────────────────────────
function renderHistogram(latencies) {
  if (latencies.length === 0) return '';
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const buckets = 10;
  const step = (max - min) / buckets || 1;
  const counts = Array(buckets).fill(0);

  for (const v of latencies) {
    const b = Math.min(Math.floor((v - min) / step), buckets - 1);
    counts[b]++;
  }

  const maxCount = Math.max(...counts);
  const barWidth = 20;
  const lines = [];

  for (let i = 0; i < buckets; i++) {
    const lo = Math.round(min + i * step);
    const hi = Math.round(min + (i + 1) * step);
    const pct = maxCount > 0 ? counts[i] / maxCount : 0;
    const bar = color(C.blue, '▇'.repeat(Math.round(pct * barWidth)));
    const label = `${String(lo).padStart(6)}ms - ${String(hi).padStart(6)}ms`;
    lines.push(`  ${color(C.gray, label)} │ ${bar} ${color(C.dim, counts[i])}`);
  }

  return lines.join('\n');
}

// ─── Report Renderer ──────────────────────────────────────────────────────────
function renderReport(stats, opts) {
  const s = stats;
  const successColor = s.errorRate > 10 ? C.red : s.errorRate > 0 ? C.yellow : C.green;

  const lines = [
    '',
    color(C.bold + C.cyan, '─── Results ──────────────────────────────────────'),
    '',
    `  ${color(C.bold, 'Requests')}`,
    `    Total:        ${color(C.bold, s.total)}`,
    `    Success:      ${color(C.green, s.success)}  (${(100 - s.errorRate).toFixed(1)}%)`,
    `    Errors:       ${color(successColor, s.errors)}  (${s.errorRate.toFixed(1)}%)`,
    `    Duration:     ${s.elapsed}ms`,
    '',
    `  ${color(C.bold, 'Latency')}`,
    `    Min:          ${s.latency.min}ms`,
    `    Mean:         ${s.latency.mean}ms`,
    `    p50:          ${color(C.green, s.latency.p50 + 'ms')}`,
    `    p95:          ${color(C.yellow, s.latency.p95 + 'ms')}`,
    `    p99:          ${color(C.red, s.latency.p99 + 'ms')}`,
    `    Max:          ${s.latency.max}ms`,
    '',
    `  ${color(C.bold, 'Throughput')}`,
    `    ${color(C.cyan, s.throughput)} req/sec`,
    '',
    `  ${color(C.bold, 'Status Codes')}`,
  ];

  for (const [code, count] of Object.entries(s.statusCodes).sort()) {
    const c = String(code).startsWith('2') ? C.green
      : String(code).startsWith('4') ? C.yellow
      : String(code).startsWith('5') ? C.red : C.gray;
    lines.push(`    ${color(c, String(code).padStart(3))}: ${count}`);
  }

  if (s.slowest.length > 0) {
    lines.push('');
    lines.push(`  ${color(C.bold, 'Slowest 5')}`);
    for (const r of s.slowest) {
      const code = r.error ? color(C.red, r.error) : color(C.yellow, r.status);
      lines.push(`    ${color(C.gray, String(r.ms).padStart(6) + 'ms')}  ${code}`);
    }
  }

  lines.push('');
  lines.push(`  ${color(C.bold, 'Latency Distribution')}`);
  lines.push(renderHistogram(s.rawLatencies));
  lines.push('');
  lines.push(color(C.gray, '──────────────────────────────────────────────────'));
  lines.push('');

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.url) {
    console.error(color(C.red, 'Error: URL is required.\n'));
    printHelp();
    process.exit(1);
  }

  // Validate URL
  try { new URL(opts.url); } catch {
    console.error(color(C.red, `Error: Invalid URL: ${opts.url}`));
    process.exit(1);
  }

  // Build headers
  const reqHeaders = {};
  for (const h of opts.headers) {
    const sep = h.indexOf(':');
    if (sep === -1) continue;
    reqHeaders[h.slice(0, sep).trim()] = h.slice(sep + 1).trim();
  }

  // Auth header — reads from env if starts with $
  if (opts.auth) {
    let authValue = opts.auth;
    if (authValue.startsWith('$')) {
      const envKey = authValue.slice(1);
      authValue = process.env[envKey] || '';
      if (!authValue) {
        console.error(color(C.yellow, `Warning: env var ${envKey} is not set, Authorization header will be empty`));
      }
    }
    // Never log authValue
    reqHeaders['Authorization'] = authValue;
  }

  if (opts.body && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }
  if (opts.body) {
    reqHeaders['Content-Length'] = Buffer.byteLength(opts.body);
  }

  const mode = opts.duration ? 'duration' : 'requests';
  const totalRequests = opts.requests || (mode === 'requests' ? 100 : null);

  const modeStr = mode === 'duration'
    ? `${opts.duration / 1000}s duration`
    : `${totalRequests} requests`;

  if (opts.format === 'text') {
    console.log('');
    console.log(`  ${color(C.bold, 'api-load-test')} ${color(C.gray, 'v1.0.0')}`);
    console.log(`  ${color(C.dim, opts.url)}`);
    console.log(`  ${color(C.dim, `${opts.method} · ${modeStr} · ${opts.concurrency} concurrent`)}`);
    if (opts.rampUp) console.log(`  ${color(C.dim, `ramp-up: ${opts.rampUp / 1000}s`)}`);
    console.log('');
  }

  const results = [];
  const startTime = Date.now();
  let lastProgressTime = Date.now();
  let lastDoneCount = 0;

  const onProgress = (done, total, _res) => {
    if (opts.format !== 'text') return;
    const now = Date.now();
    const elapsed = (now - lastProgressTime) / 1000;
    let rps = null;
    if (elapsed >= 0.5) {
      rps = Math.round((done - lastDoneCount) / elapsed);
      lastProgressTime = now;
      lastDoneCount = done;
    }
    renderProgress(done, total, rps);
  };

  const makeReq = () => makeRequest(opts, reqHeaders);

  if (mode === 'duration') {
    const durationResults = await runDuration({
      durationMs: opts.duration,
      concurrency: opts.concurrency,
      makeReq,
      onResult: (r, done, _total) => {
        results.push(r);
      },
      onProgress,
      rampUp: opts.rampUp,
    });
    // already pushed in onResult
    if (opts.format === 'text') process.stdout.write('\n');
  } else {
    // Ramp-up for request mode: stagger concurrency slots if needed
    const rampUp = opts.rampUp;
    const concurrency = opts.concurrency;

    const tasks = Array.from({ length: totalRequests }, (_, i) => async () => {
      if (rampUp) {
        // Delay workers beyond initial concurrency based on ramp time
        const slot = i % concurrency;
        if (slot > 0) {
          const delay = (rampUp / concurrency) * slot;
          await new Promise((r) => setTimeout(r, delay * Math.min(1, i / concurrency)));
        }
      }
      return makeReq();
    });

    await runPool({
      tasks,
      concurrency,
      onResult: (r) => {
        results.push(r);
        onProgress(results.length, totalRequests, results);
      },
    });

    if (opts.format === 'text') process.stdout.write('\n');
  }

  const elapsed = Date.now() - startTime;
  const stats = calcStats(results, elapsed);

  if (opts.format === 'json') {
    const out = JSON.stringify({ url: opts.url, options: { method: opts.method, concurrency: opts.concurrency, requests: totalRequests, duration: opts.duration }, stats: { ...stats, rawLatencies: undefined } }, null, 2);
    console.log(out);
    if (opts.output) {
      writeFileSync(opts.output, out, 'utf8');
    }
    return;
  }

  // Text report
  console.log(renderReport(stats, opts));

  if (opts.output) {
    const out = JSON.stringify({ url: opts.url, options: { method: opts.method, concurrency: opts.concurrency, requests: totalRequests, duration: opts.duration }, stats: { ...stats, rawLatencies: undefined } }, null, 2);
    writeFileSync(opts.output, out, 'utf8');
    console.log(color(C.gray, `  Report saved to ${opts.output}\n`));
  }
}

main().catch((err) => {
  console.error(color(C.red, `\nFatal: ${err.message}`));
  process.exit(1);
});
