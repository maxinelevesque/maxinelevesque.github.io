/**
 * OG image generation. Renders an HTML-shaped tree through satori to SVG,
 * then through resvg to PNG. Invoked from build-time API routes in
 * src/pages/og/**.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Astro runs the build from the project root, so process.cwd() points
// there reliably. Using import.meta.url breaks because the lib is
// bundled into dist/chunks/* at build time.
const FONTS = join(process.cwd(), 'src/fonts');
const REGULAR = readFileSync(join(FONTS, 'EBGaramond-Regular.ttf'));
const ITALIC = readFileSync(join(FONTS, 'EBGaramond-Italic.ttf'));
const SEMIBOLD = readFileSync(join(FONTS, 'EBGaramond-SemiBold.ttf'));

const THEMES = {
  solo: { bg: '#2e1420', accent: '#dba0a0', text: '#e4dbd0', muted: '#9a8578', rule: '#4a2838' },
  dial: { bg: '#0a0b12', accent: '#7ca0c8', text: '#ccc8c0', muted: '#5a5664', rule: '#1e1d28' },
} as const;

export type OGTheme = keyof typeof THEMES;

export interface OGOptions {
  title: string;
  subtitle?: string;
  tag?: string;
  theme?: OGTheme;
}

// satori accepts React-element-shaped objects. We avoid JSX so this file
// stays plain .ts.
function el(type: string, style: Record<string, unknown>, children: unknown): unknown {
  return { type, props: { style, children } };
}

export async function makeOG({
  title,
  subtitle = '',
  tag = "Maxine's dream machine",
  theme = 'solo',
}: OGOptions): Promise<Uint8Array> {
  const t = THEMES[theme];

  // Scale title down for long ones so it fits the 1040px content width.
  const titleSize = title.length > 60 ? 56 : title.length > 38 ? 72 : 88;

  const tree = el(
    'div',
    {
      width: 1200,
      height: 630,
      background: t.bg,
      display: 'flex',
      flexDirection: 'column',
      padding: '80px',
      fontFamily: 'EB Garamond',
      position: 'relative',
    },
    [
      // Top wordmark / tag
      el(
        'div',
        {
          color: t.muted,
          fontSize: 22,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          display: 'flex',
        },
        tag,
      ),

      // Title block (centered vertically)
      el(
        'div',
        {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
        },
        [
          el(
            'div',
            {
              color: t.accent,
              fontSize: titleSize,
              fontStyle: 'italic',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              display: 'flex',
            },
            title,
          ),
          subtitle
            ? el(
                'div',
                {
                  color: t.muted,
                  fontSize: 30,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  maxWidth: 900,
                  display: 'flex',
                },
                subtitle,
              )
            : null,
        ].filter(Boolean),
      ),

      // Bottom signature
      el(
        'div',
        {
          color: t.muted,
          fontSize: 24,
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderTop: `1px solid ${t.rule}`,
          paddingTop: 24,
        },
        [
          el('span', { color: t.accent, display: 'flex' }, 'Maxine Levesque'),
          el('span', { opacity: 0.4, display: 'flex' }, '·'),
          el('span', { display: 'flex' }, '@maxine.science'),
        ],
      ),
    ],
  );

  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'EB Garamond', data: REGULAR, weight: 400, style: 'normal' },
      { name: 'EB Garamond', data: ITALIC, weight: 400, style: 'italic' },
      { name: 'EB Garamond', data: SEMIBOLD, weight: 600, style: 'normal' },
    ],
  });

  const png = new Resvg(svg).render().asPng();
  return png;
}
