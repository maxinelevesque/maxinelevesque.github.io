import { rational, parseRational, fractionText, complement } from './rational.mjs';

export function initFractionBars(root = document) {
  for (const figure of root.querySelectorAll('[data-figure="fraction-bar"]')) {
    if (figure.dataset.enhanced) continue;
    try {
      const initial = parseRational(figure.dataset.value);
      if (initial.n < 0n || initial.n > initial.d || 12n % initial.d) throw new RangeError('The sample value must lie on the twelve-part grid.');
      const initialUnits = Number(initial.n * (12n / initial.d));
      const panel = document.createElement('div');
      panel.className = 'figure-live';
      // All markup here is site-owned. No Markdown or directive content is
      // evaluated as code or interpolated into HTML.
      panel.innerHTML = `
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
        <p class="figure-status" role="status" aria-live="polite" aria-atomic="true"></p>
        <p class="figure-help">Drag the underlined fraction · arrow keys change one twelfth · <a href="/prototypes/assets/fraction-bar.svg">Static starting image</a></p>`;
      const slider = panel.querySelector('input');
      const scrub = panel.querySelector('.scrub');
      const svg = panel.querySelector('svg');
      panel.querySelector('title').id = `${figure.id}-title`;
      panel.querySelector('desc').id = `${figure.id}-description`;
      svg.setAttribute('aria-labelledby', `${figure.id}-title`);
      svg.setAttribute('aria-describedby', `${figure.id}-description`);
      let units = initialUnits;
      const draw = (next, announce = true) => {
        units = Math.max(0, Math.min(12, Math.round(next)));
        const value = rational(BigInt(units), 12n);
        const label = fractionText(value);
        const rest = fractionText(complement(value));
        slider.value = String(units);
        slider.setAttribute('aria-valuetext', `${label} of the whole`);
        scrub.textContent = label;
        scrub.setAttribute('aria-valuenow', String(units));
        scrub.setAttribute('aria-valuetext', `${label} of the whole`);
        // Only geometry scales to fit the available width. Labels are regular
        // HTML at a fixed text size; no computed claim depends on a float.
        panel.querySelector('.bar-fill').setAttribute('width', String(units * 64));
        panel.querySelector('.filled-label').textContent = `Filled: ${label}`;
        panel.querySelector('.remainder-label').textContent = `Remainder: ${rest}`;
        const description = `${units} of 12 cells filled: ${label}. Remainder: ${rest}.`;
        panel.querySelector('desc').textContent = description;
        if (announce) panel.querySelector('.figure-status').textContent = description;
      };
      slider.addEventListener('input', () => draw(Number(slider.value)));
      panel.querySelector('button').addEventListener('click', () => draw(initialUnits));
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
      draw(initialUnits, false);
      figure.prepend(panel);
      // The ordinary image and Markdown caption are rendered first. Hide the
      // image only after a complete, working enhancement has been mounted.
      figure.querySelector(':scope > p').hidden = true;
      figure.dataset.enhanced = 'true';
    } catch (error) {
      console.error('Figure enhancement failed; retaining the static image.', error);
    }
  }
}
