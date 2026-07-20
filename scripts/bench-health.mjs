#!/usr/bin/env node
/**
 * Quick health endpoint benchmark.
 * Usage: npm run bench:health
 */
const url = process.env.BENCH_URL ?? 'http://localhost:3001/api/v1/health';
const runs = Number(process.env.BENCH_RUNS ?? 20);

async function once() {
  const start = performance.now();
  const res = await fetch(url);
  const ms = performance.now() - start;
  return { ok: res.ok, ms };
}

const results = [];
for (let i = 0; i < runs; i++) {
  results.push(await once());
}

const ok = results.filter((r) => r.ok).length;
const times = results.map((r) => r.ms).sort((a, b) => a - b);
const p50 = times[Math.floor(times.length * 0.5)] ?? 0;
const p95 = times[Math.floor(times.length * 0.95)] ?? 0;

console.log(`URL: ${url}`);
console.log(`Runs: ${runs}, success: ${ok}/${runs}`);
console.log(`Latency ms � p50: ${p50.toFixed(1)}, p95: ${p95.toFixed(1)}, max: ${times.at(-1)?.toFixed(1)}`);
