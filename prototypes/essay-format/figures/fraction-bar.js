// Sample figure component for the interactive essay format (SPEC.md,
// "Figure components"). It draws only inside `host`, reads its starting value
// from the marker's attributes, and follows the page switch (`notation`).
import { rational, parseRational, fractionText, complement } from './rational.mjs';
import './fraction-bar.css';

const twelfths = ({ n, d }) => `${n * (12n / d)}/12`;

export function mount(host, { id, attrs, params, on }) {
  const initial = parseRational(attrs.value);
  if (initial.n < 0n || initial.n > initial.d || 12n % initial.d) throw new RangeError('The sample value must lie on the twelve-part grid.');
  const initialUnits = Number(initial.n * (12n / initial.d));
  let notation = params.notation ?? 'lowest';
  const show = (value) => (notation === 'twelfths' ? twelfths(value) : fractionText(value));

  // All markup here is the component's own; no source text is interpolated.
  host.classList.add('fraction-bar');
  host.innerHTML = `
    <div class="figure-controls">
      <label>Filled portion <input type="range" min="0" max="12" step="1" aria-label="Filled twelfths"></label>
      <span role="spinbutton" tabindex="0" aria-label="Filled twelfths; drag or use arrow keys" aria-valuemin="0" aria-valuemax="12" class="scrub"></span>
      <button type="button">Reset</button>
    </div>
    <svg viewBox="0 0 768 48" preserveAspectRatio="none" role="img">
      <title>Fraction of a whole</title><desc></desc>
      <rect class="bar-track" width="768" height="48" rx="2"/>
      <rect class="bar-fill" height="48"/>
      <path class="bar-grid" d="M64 0v48m64-48v48m64-48v48m64-48v48m64-48v48m64-48v48m64-48v48m64-48v48m64-48v48m64-48v48m64-48v48"/>
    </svg>
    <div class="figure-values"><span class="filled-label"></span><span class="remainder-label"></span></div>
    <p class="figure-status" role="status" aria-live="polite" aria-atomic="true"></p>`;
  const slider = host.querySelector('input');
  const scrub = host.querySelector('.scrub');
  const svg = host.querySelector('svg');
  host.querySelector('title').id = `${id}-title`;
  host.querySelector('desc').id = `${id}-description`;
  svg.setAttribute('aria-labelledby', `${id}-title`);
  svg.setAttribute('aria-describedby', `${id}-description`);

  let units = initialUnits;
  const draw = (next, announce = true) => {
    units = Math.max(0, Math.min(12, Math.round(next)));
    const value = rational(BigInt(units), 12n);
    const label = show(value);
    const rest = show(complement(value));
    slider.value = String(units);
    slider.setAttribute('aria-valuetext', `${label} of the whole`);
    scrub.textContent = label;
    scrub.setAttribute('aria-valuenow', String(units));
    scrub.setAttribute('aria-valuetext', `${label} of the whole`);
    // Only the geometry scales with the container; labels are HTML text.
    host.querySelector('.bar-fill').setAttribute('width', String(units * 64));
    host.querySelector('.filled-label').textContent = `Filled: ${label}`;
    host.querySelector('.remainder-label').textContent = `Remainder: ${rest}`;
    const description = `${units} of 12 cells filled: ${label}. Remainder: ${rest}.`;
    host.querySelector('desc').textContent = description;
    if (announce) host.querySelector('.figure-status').textContent = description;
  };
  slider.addEventListener('input', () => draw(Number(slider.value)));
  host.querySelector('button').addEventListener('click', () => draw(initialUnits));
  scrub.addEventListener('keydown', (event) => {
    const next = { ArrowRight: units + 1, ArrowUp: units + 1, ArrowLeft: units - 1, ArrowDown: units - 1, Home: 0, End: 12 }[event.key];
    if (next !== undefined) { event.preventDefault(); draw(next); }
  });
  let drag = null;
  scrub.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    drag = { x: event.clientX, units };
    scrub.setPointerCapture(event.pointerId);
    scrub.focus();
  });
  scrub.addEventListener('pointermove', (event) => {
    if (drag) draw(drag.units + (event.clientX - drag.x) / 12);
  });
  const stop = () => { drag = null; };
  scrub.addEventListener('pointerup', stop);
  scrub.addEventListener('pointercancel', stop);
  scrub.addEventListener('lostpointercapture', stop);
  on('notation', (next) => { notation = next; draw(units, false); });
  draw(initialUnits, false);
  // For review previews: a comment saves where the bar was, and "show me" puts it back.
  return {
    getState: () => ({ units }),
    setState: (state) => { if (Number.isFinite(state?.units)) draw(state.units, false); },
  };
}
