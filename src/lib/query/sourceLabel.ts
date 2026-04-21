export function formatSourceLabel(
  mergedMode: boolean,
  sourceLabel: string,
  message: string,
): string {
  return mergedMode ? `[${sourceLabel}] ${message}` : message
}
