// Values remain reduced BigInt fractions until the final SVG coordinate.
export function rational(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (d === 0n) throw new RangeError('A fraction needs a nonzero denominator.');
  if (d < 0n) { n = -n; d = -d; }
  let a = n < 0n ? -n : n;
  let b = d;
  while (b) [a, b] = [b, a % b];
  return { n: n / a, d: d / a };
}
export function parseRational(value) {
  if (!/^\d+\/\d+$/.test(value)) throw new TypeError('Expected an integer fraction.');
  return rational(...value.split('/').map(BigInt));
}
export const fractionText = ({ n, d }) => d === 1n ? String(n) : `${n}/${d}`;
export const complement = ({ n, d }) => rational(d - n, d);
