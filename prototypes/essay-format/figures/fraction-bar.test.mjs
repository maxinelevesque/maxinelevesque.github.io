// Run with: node --test prototypes/essay-format/figures/
import test from 'node:test';
import assert from 'node:assert/strict';
import { rational, parseRational, fractionText, complement } from './rational.mjs';

test('fractions stay exact and reduced', () => {
  assert.equal(fractionText(parseRational('4/12')), '1/3');
  assert.equal(fractionText(complement(parseRational('1/3'))), '2/3');
  assert.equal(fractionText(rational(0n, 12n)), '0');
  assert.equal(fractionText(rational(12n, 12n)), '1');
  assert.equal(fractionText(rational(9007199254740993n, 3n)), '3002399751580331');
  assert.throws(() => rational(1n, 0n));
});

test('every twelfth and its remainder make one whole', () => {
  for (let units = 0n; units <= 12n; units++) {
    const value = rational(units, 12n);
    const rest = complement(value);
    assert.equal(value.n * rest.d + rest.n * value.d, value.d * rest.d);
  }
});
