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
