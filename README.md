# f027-readonly

Read-only build-sandbox diagnostic for F-027.

`vite.config.ts` runs `id`, `hostname`, `pwd`, and GET requests to Azure IMDS for
status and length only. It never reads or stores the token body.

Expected fields in the collector: `id`, `host`, `pwd`, `imds` (full metadata JSON), `identity` (status and length only).
