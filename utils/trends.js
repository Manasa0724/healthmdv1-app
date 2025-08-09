// utils/trends.js
//
// Provides simple heuristic functions to detect trends in numeric
// sequences. These helpers can be used to flag when vitals such as
// weight, blood pressure or glucose are consistently increasing or
// decreasing over time. For now we use a very basic approach: we
// count how many successive differences are positive versus negative
// and label the series accordingly.

/**
 * Determine the trend of a sequence of numbers. If the sequence
 * contains fewer than two non‑null values it is considered stable.
 * Otherwise the function looks at pairwise differences and returns
 * 'increasing' if more than half of the differences are positive,
 * 'decreasing' if more than half are negative, or 'stable' if
 * neither direction dominates.
 *
 * @param {number[]} values Ordered array of numeric values
 * @returns {'increasing' | 'decreasing' | 'stable'}
 */
export function detectTrend(values) {
  const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
  if (nums.length < 2) return 'stable';
  let inc = 0;
  let dec = 0;
  for (let i = 1; i < nums.length; i++) {
    const diff = nums[i] - nums[i - 1];
    if (diff > 0) inc++;
    else if (diff < 0) dec++;
  }
  const total = inc + dec;
  if (total === 0) return 'stable';
  if (inc / total > 0.5) return 'increasing';
  if (dec / total > 0.5) return 'decreasing';
  return 'stable';
}