# f027-readonly

Read-only build-sandbox diagnostic for F-027.

`vite.config.ts` writes `public/f027-result.json` during the build, before the
Vite server starts. The file has:

- `id`, `host`, `pwd`
- `imds`: the full Azure IMDS metadata JSON
- `identity`: token endpoint status and body length only

No external callback is used. The result stays inside the Ema sandbox and is
served by the preview.

## Read the result

After the preview is up:

```bash
curl -s "https://preview-<id>.app-e1-frontier.ema.co/f027-result.json" | jq
```

The `imds` object contains subscription, resource group, VM, and network data.
Treat the result as sensitive and delete the session after reading.
