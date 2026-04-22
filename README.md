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

## Quick Start

From the repo root:

```bash
cd /usr/local/personal/logger-cli
bun install
bun run dev -- examples/mixed.log
```

That starts the interactive TUI immediately.

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

Load config from an explicit path:

```bash
bun run dev -- --config ./logger.jsonc examples/mixed.log
```

Merge multiple live sources:

```bash
bun run dev -- --merge --merge-sort time app.log --url https://example.com/logs --cmd "docker logs -f app 2>&1"
```

Use config-driven columns:

```bash
cp examples/.logger.jsonc ./.logger.jsonc
bun run dev -- examples/mixed.log
```

Keybinding remaps and merge-sort remap example:

```jsonc
{
  "columns": [
    { "key": "client", "path": "$.client" }
  ],
  "keybindings": {
    "toggleReverse": ["v"],
    "cycleMergeSort": ["S"]
  }
}
```

Supported keybinding action ids:

```text
openHelp
openFilter
toggleReverse
nextTab
prevTab
moveUp
moveDown
pageUp
pageDown
jumpTop
jumpBottom
enterDetail
leaveDetail
toggleFold
detailSearch
repeatSearchNext
repeatSearchPrev
copyValue
copyPath
toggleAnsi
cycleMergeSort
```

Config lookup order:

1. `--config path`
2. `./.logger.jsonc`
3. `$HOME/.config/logger/config.jsonc`

Built CLI:

```bash
bun run build
bun run start -- examples/mixed.log
./bin/logger examples/mixed.log
```

Compiled executable:

```bash
bun run compile:exe
./bin/logger examples/mixed.log
```

## Query Mode

Query Mode is inspired by jnv.

Mode switching:

- `Shift+Down`: enter Query Mode
- `Shift+Up`: return to Browse Mode

In Query Mode:

- a query editor appears at the top
- a result pane appears underneath
- if `queryMode.noHint` is not true, a hint line is shown

Behavior:

- if the selected entry is JSON, the query runs against that JSON value
- if `A` is toggled in Query Mode, the query is applied to all JSON entries in the active source and results are shown as a list

Query execution:

- if `jq` is on `PATH`, `logger` will try to evaluate the query with `jq`
- otherwise a minimal fallback is supported:
  - `.`
  - `.foo`
  - `.foo[0]`

Autocomplete:

- suggestions are derived from the currently selected JSON object
- `Tab` accepts the current suggestion

Query Mode keybindings:

- `Ctrl+Q`: copy query
- `Ctrl+O`: copy current result
- `Tab`: accept autocomplete
- `Enter`: toggle fold when result is JSON
- `Ctrl+P`: expand all JSON result folds
- `Ctrl+N`: collapse all JSON result folds
- `Esc`: leave Query Mode

Example queries:

```text
.
.request
.request.method
.items[0]
```

## Keybindings

- `F` or `/`: open advanced filter bar
- `1` trace toggle
- `2` debug toggle
- `3` info toggle
- `4` warn toggle
- `5` error toggle
- `6` fatal toggle
- `Up` / `Down` or `j` / `k`: move selection
- `PgUp` / `PgDn`: page
- `Home` / `End`: jump beginning/end
- `g` / `G`: jump top/bottom
- `Tab`: next source tab
- `Shift+Tab`: previous source tab
- `Enter`: toggle detail focus
- `Esc`: leave detail focus / close help
- `/`: open filter mode
- `Space`: fold/unfold current JSON node in detail pane
- `R`: reverse order
- `M`: cycle merge sort in merged mode
- `F1` or `?`: help
- `q`: quit

## Filter language

Examples:

```text
request.method = "GET"
request.method != "POST"
latency >= 100 and latency < 500
message ~= "timeout"
message !~= "healthcheck"
message like "err*"
message ~~= "request\\s+failed"
exists(.request.method)
not exists(.request.user)
level in ("warn","error","fatal")
service not in ("metrics","health")
.request.user? = "alice"
(request.method = "GET" and level = "warn") or message ~= "panic"
span.[].name = "db"
span.[1].name = "http"
```

Supported operators:

- `=`
- `!=`
- `>`
- `>=`
- `<`
- `<=`
- `~=`
- `!~=`
- `like`
- `~~=`
- `in (...)`
- `not in (...)`
- `exists(...)`
- `not exists(...)`
- `and`
- `or`
- `not`
- parentheses

Notes:

- Dot paths target structured JSON fields, for example `request.method`
- Leading-dot paths like `.field` always start from the parsed JSON object
- `field? = value` means the field is optional: absent is treated as a match
- Text entries can still be filtered through built-in fields like `message`

## Main line templates

Use `mainLineTemplate` in config to control the compact list row format.

Available variables:

- `timestamp`
- `level`
- `message`
- `prefix`
- `json`
- `raw`

Available helpers:

- `bold`
- `red`
- `yellow`
- `green`
- `cyan`
- `blue`
- `purple`
- `uppercase`
- `fixed_size`
- `min_size`
- `level_style`

Example:

```jsonc
{
  "mainLineTemplate": "{{timestamp}} {{level_style (min_size level 5)}} {{prefix}}{{message}}",
  "placeholderFormat": "#{key}",
  "contextPath": "extra_data"
}
```

Placeholder substitution example:

If `message` is:

```text
hello #{user}
```

and `json.extra_data.user` is `alice`, the rendered message becomes:

```text
hello alice
```

If `NO_COLOR` is set, the template helpers return plain text without ANSI styling.

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
- `src/lib/query`: interactive filter logic
- `src/lib/config`: config loading
