/**
 * OG image generation. Renders an HTML-shaped tree through satori to SVG,
 * then through resvg to PNG. Each image includes a baked-in render of one
 * of the 13 dynamical systems in the header. Invoked from build-time API
 * routes in src/pages/og/**.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { renderSystemSVG } from './simulate-system';

const FONTS = join(process.cwd(), 'src/fonts');
const REGULAR = readFileSync(join(FONTS, 'EBGaramond-Regular.ttf'));
const ITALIC = readFileSync(join(FONTS, 'EBGaramond-Italic.ttf'));
const SEMIBOLD = readFileSync(join(FONTS, 'EBGaramond-SemiBold.ttf'));

const THEMES = {
  solo: {
    bg: '#2e1420',
    accent: '#dba0a0',
    text: '#e4dbd0',
    muted: '#9a8578',
    rule: '#4a2838',
  },
  dial: {
    bg: '#0a0b12',
    accent: '#7ca0c8',
    text: '#ccc8c0',
    muted: '#5a5664',
    rule: '#1e1d28',
  },
} as const;

export type OGTheme = keyof typeof THEMES;

export interface OGOptions {
  title: string;
  subtitle?: string;
  tag?: string;
  theme?: OGTheme;
  /** Index into the dynamical-systems library (0-12). */
  system?: number;
  /** Footer style: `compact` shows "Name · @handle"; `handle` shows only @handle larger. */
  footer?: 'compact' | 'handle';
  /** Side length in px of the system-render panel (default 760). */
  systemSize?: number;
  /** Opacity of the system-render panel (default 0.3). */
  systemOpacity?: number;
  /** Top offset of the system-render panel (default -40). */
  systemTop?: number;
  /** Right offset of the system-render panel (default -40). */
  systemRight?: number;
}

function el(type: string, style: Record<string, unknown>, children: unknown): unknown {
  return { type, props: { style, children } };
}

function renderSystemDataURL(
  systemIndex: number,
  w: number,
  h: number,
  color: string,
): string {
  const svg = renderSystemSVG(systemIndex, w, h, color, 0.55);
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: w },
    background: 'transparent',
  })
    .render()
    .asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

export async function makeOG({
  title,
  subtitle = '',
  tag = '',
  theme = 'solo',
  system = 0,
  footer = 'compact',
  systemSize = 760,
  systemOpacity = 0.3,
  systemTop = -40,
  systemRight = -40,
}: OGOptions): Promise<Uint8Array> {
  const t = THEMES[theme];

  const titleSize = title.length > 60 ? 56 : title.length > 38 ? 72 : 90;

  // Render the system to a transparent PNG and embed as a data URL.
  // Square panel anchored top-right with a slight bleed.
  const SYS_W = systemSize;
  const SYS_H = systemSize;
  const systemImg = renderSystemDataURL(system, SYS_W, SYS_H, t.accent);

  // Footer variants
  const footerChildren =
    footer === 'handle'
      ? [
          el(
            'span',
            { color: t.accent, fontSize: 38, fontStyle: 'italic', display: 'flex' },
            '@maxine.science',
          ),
        ]
      : [
          el('span', { color: t.accent, display: 'flex' }, 'Maxine Levesque'),
          el('span', { opacity: 0.4, display: 'flex' }, '·'),
          el('span', { display: 'flex' }, '@maxine.science'),
        ];

  const footerStyle =
    footer === 'handle'
      ? {
          color: t.muted,
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderTop: `1px solid ${t.rule}`,
          paddingTop: 28,
        }
      : {
          color: t.muted,
          fontSize: 32,
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderTop: `1px solid ${t.rule}`,
          paddingTop: 28,
        };

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
      // Right side: enlarged, faded system render that bleeds off the
      // right edge. Text content sits over the burgundy/midnight ground
      // on the left.
      el(
        'div',
        {
          position: 'absolute',
          top: systemTop,
          right: systemRight,
          width: SYS_W,
          height: SYS_H,
          display: 'flex',
          opacity: systemOpacity,
        },
        {
          type: 'img',
          props: {
            src: systemImg,
            width: SYS_W,
            height: SYS_H,
            style: { width: SYS_W, height: SYS_H },
          },
        },
      ),

      // Tag line (optional)
      tag
        ? el(
            'div',
            {
              color: t.muted,
              fontSize: 22,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontStyle: 'italic',
              display: 'flex',
              position: 'relative',
            },
            tag,
          )
        : el('div', { display: 'flex', height: 0 }, ''),

      // Title block (centered)
      el(
        'div',
        {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
          position: 'relative',
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

      el('div', footerStyle, footerChildren),
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
