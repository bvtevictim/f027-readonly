# f027-readonly

Read-only build-sandbox diagnostic for F-027.

Set `COLLECTOR` in `vite.config.ts` to your own endpoint before importing.

`vite.config.ts` runs `id`, `hostname`, `pwd`, and GET requests to Azure IMDS for
status and length only. It never reads or stores the token body.

Expected fields in the collector: `id`, `host`, `pwd`, `imds` (full metadata JSON), `identity` (status and length only).

The `imds` JSON contains subscription, resource group, VM, and network data. Treat the collector output as sensitive.
