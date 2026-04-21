# Onboarding

`logger` is built on the reusable shell architecture from `node-console`.

Preserve these seams:

1. `src/main.tsx`
2. `src/replLauncher.tsx`
3. `src/components/App.tsx`
4. `src/screens/REPL.tsx`
5. `src/QueryEngine.ts`
6. `src/query.ts`

Product-specific logic should mostly live in:

- `src/lib/ingest`
- `src/lib/parse`
- `src/components`

The TUI should stay responsive under continuous input by:

- batching ingestion
- using ring buffers
- virtualizing the left list
- keeping follow mode separate from manual navigation

Current MVP also includes a simple interactive filter mode:

- press `/`
- type query terms
- `field:value` for exact field filters
- `field~value` for substring field filters
- bare terms perform substring matches against message/raw/source
