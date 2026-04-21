# logger

`logger` is a Bun-first TUI for browsing mixed server log streams.

It is optimized for:

- JSONL most of the time
- plain text sometimes
- files, stdin, HTTP streams, or spawned commands
- a compact virtualized list on the left
- a JSON tree or raw text details view on the right

## Usage

```bash
bun install
bun run dev -- examples/mixed.log
```

Open multiple files as tabs:

```bash
bun run dev -- access.log app.log
```

Read from stdin:

```bash
cat examples/mixed.log | bun run dev --
```

Stream from a URL:

```bash
bun run dev -- --url https://example.com/logs
```

Stream from a command:

```bash
bun run dev -- --cmd "docker logs -f my-container 2>&1"
```

## Keybindings

- `Up` / `Down` or `j` / `k`: move selection
- `PgUp` / `PgDn`: page
- `Home` / `End`: jump beginning/end
- `g` / `G`: jump top/bottom
- `Tab`: next source tab
- `Shift+Tab`: previous source tab
- `Enter`: toggle detail focus
- `Esc`: leave detail focus / close help
- `Space`: fold/unfold current JSON node in detail pane
- `R`: reverse order
- `F1` or `?`: help
- `q`: quit

## Scripts

```bash
bun run typecheck
bun test
bun run build
bun run compile:exe
```

## File Layout

- `src/main.tsx`: launch spine
- `src/replLauncher.tsx`: shell handoff
- `src/components/App.tsx`: providers
- `src/screens/REPL.tsx`: TUI kernel
- `src/QueryEngine.ts`: source/session facade
- `src/query.ts`: view transform helpers
- `src/lib/ingest`: sources and ring buffer
- `src/lib/parse`: mixed JSON/text parsing

