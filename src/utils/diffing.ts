export type DiffKind = 'added' | 'removed' | 'unchanged';

export interface DiffLine {
  kind: DiffKind;
  text: string;
}

/** Above this product the O(rows*cols) LCS matrix is too large; fall back to a linear diff. */
const MAX_LCS_CELLS = 1_000_000;

/**
 * Linear fallback for very large inputs: keep the common prefix and suffix, then
 * mark the differing middle as removed-then-added. Avoids the quadratic matrix.
 */
function trimDiff(a: string[], b: string[]): DiffLine[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start += 1;
  }

  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1;
    endB -= 1;
  }

  const result: DiffLine[] = [];
  for (let i = 0; i < start; i += 1) {
    result.push({ kind: 'unchanged', text: a[i] });
  }
  for (let i = start; i < endA; i += 1) {
    result.push({ kind: 'removed', text: a[i] });
  }
  for (let i = start; i < endB; i += 1) {
    result.push({ kind: 'added', text: b[i] });
  }
  for (let i = endA; i < a.length; i += 1) {
    result.push({ kind: 'unchanged', text: a[i] });
  }
  return result;
}

/**
 * Line-level diff using the classic longest-common-subsequence approach so both
 * additions and removals are surfaced, Git-style. Falls back to a linear diff
 * when the inputs are large enough that the LCS matrix would be prohibitive.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');
  const rows = a.length;
  const cols = b.length;

  if ((rows + 1) * (cols + 1) > MAX_LCS_CELLS) {
    return trimDiff(a, b);
  }

  const lcs: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0));
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (a[i] === b[j]) {
      result.push({ kind: 'unchanged', text: a[i] });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ kind: 'removed', text: a[i] });
      i += 1;
    } else {
      result.push({ kind: 'added', text: b[j] });
      j += 1;
    }
  }
  while (i < rows) {
    result.push({ kind: 'removed', text: a[i] });
    i += 1;
  }
  while (j < cols) {
    result.push({ kind: 'added', text: b[j] });
    j += 1;
  }

  return result;
}

export function diffStats(lines: DiffLine[]): { added: number; removed: number } {
  return lines.reduce(
    (stats, line) => {
      if (line.kind === 'added') stats.added += 1;
      if (line.kind === 'removed') stats.removed += 1;
      return stats;
    },
    { added: 0, removed: 0 },
  );
}
