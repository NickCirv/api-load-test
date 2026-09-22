# api-load-test — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`9b5223fbcdf7df3b36c4cdb45892538c7bf8033f`](https://github.com/NickCirv/api-load-test/commit/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f).
- Tree: `38c1a8ba407d569cf0627678c12eaf5bdff3b54a`; truncated: `false`.
- Capture: 6 of 6 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/package.json) | Source declaration inspected; runtime unverified |
| Sends concurrent HTTP requests and summarizes latency, throughput and errors for endpoint experiments. | [index.js](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/index.js) | Implementation interfaces inspected; behavior not executed |
| Count or duration runs; concurrency and ramp-up controls; configurable requests; percentile latency and output reports. | [index.js](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/index.js) | Source-backed scope, not a test result |
| Results depend on the load-generator host and network and are not a distributed capacity benchmark. Each run sends real traffic; use an endpoint you control. | [index.js](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test/smoke.test.js](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/test/smoke.test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Unresolved issues

Results depend on the load-generator host and network and are not a distributed capacity benchmark. Each run sends real traffic; use an endpoint you control.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/LICENSE) | `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d` | 1072 |
| [README.md](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/README.md) | `4dd0b0728ed6fb7724717eaddaf68ca24afb3c57a6b7157f06c344d6dc0cf014` | 2520 |
| [package.json](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/package.json) | `78ed399196f04670e454d75b23d7a36b68c53bcc7fa187a7d60708c557eb0c7b` | 823 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/.github/workflows/ci.yml) | `433fbf65635a767ef5cd787147104c248d0cea6bbd6523c6c862f915e0e3206a` | 384 |
| [index.js](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/index.js) | `5325739ba9e840bbf0531db19e99b87e6a8e58b1e12f61106948fab3e30ca648` | 18199 |
| [test/smoke.test.js](https://github.com/NickCirv/api-load-test/blob/9b5223fbcdf7df3b36c4cdb45892538c7bf8033f/test/smoke.test.js) | `d5426592565aa06e56313a7009490e5adbb1755a57e1b11075982b2ed5d228a0` | 451 |
