import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

/**
 * The design's icon set, drawn from its own path data.
 *
 * Ported literally rather than mapped onto a bundled icon font. The set is
 * mostly Feather-shaped, but a handful of glyphs are not — the filled `home`,
 * the two heart states, the stylised `store` — and mixing a font for the
 * matches with custom paths for the rest produces two different stroke weights
 * sitting side by side in the same tab bar.
 *
 * Every glyph is authored on a 24×24 canvas with a 2px stroke, so a single
 * `size` prop scales the whole set coherently.
 */
export type IconName =
  | 'home'
  | 'search'
  | 'plus'
  | 'bag'
  | 'user'
  | 'heart'
  | 'heartFilled'
  | 'back'
  | 'bell'
  | 'star'
  | 'check'
  | 'x'
  | 'truck'
  | 'store'
  | 'chart'
  | 'package'
  | 'edit'
  | 'upload'
  | 'settings'
  | 'pin'
  | 'card'
  | 'gift'
  | 'signOut'
  | 'shield'
  | 'dollar'
  | 'eye'
  | 'chevronRight'
  | 'minus'
  | 'trash'
  | 'share'
  | 'filter';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/**
 * Glyphs are functions of colour because some fill and some stroke, and a few
 * do both. Passing `color` down per-element is what keeps a filled star and a
 * stroked bell tinting identically from one call site.
 */
const GLYPHS: Record<IconName, (c: string) => React.ReactNode> = {
  home: (c) => <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H15v-5H9v5H4a1 1 0 01-1-1z" fill={c} />,

  search: (c) => (
    <>
      <Circle cx={11} cy={11} r={7} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M20 20l-3.5-3.5" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </>
  ),

  plus: (c) => <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.5} strokeLinecap="round" />,

  bag: (c) => (
    <>
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={c} strokeWidth={2} fill="none" />
      <Path d="M3 6h18M16 10a4 4 0 01-8 0" stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  user: (c) => (
    <>
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={c} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={7} r={4} stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  heart: (c) => (
    <Path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 000-7.78z"
      stroke={c}
      strokeWidth={2}
      fill="none"
    />
  ),

  heartFilled: (c) => (
    <Path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 000-7.78z"
      fill={c}
    />
  ),

  back: (c) => (
    <Path
      d="M19 12H5M12 5l-7 7 7 7"
      stroke={c}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),

  bell: (c) => (
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      stroke={c}
      strokeWidth={2}
      fill="none"
    />
  ),

  star: (c) => (
    <Polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={c} />
  ),

  check: (c) => (
    <Polyline points="20,6 9,17 4,12" stroke={c} strokeWidth={2.5} strokeLinecap="round" fill="none" />
  ),

  x: (c) => <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={2} strokeLinecap="round" />,

  truck: (c) => (
    <>
      <Rect x={1} y={3} width={15} height={13} rx={1} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M16 8h4l3 4v5h-7V8z" stroke={c} strokeWidth={2} fill="none" />
      <Circle cx={5.5} cy={18.5} r={1.5} fill={c} />
      <Circle cx={18.5} cy={18.5} r={1.5} fill={c} />
    </>
  ),

  store: (c) => (
    <Path
      d="M3 9l1-6h16l1 6M3 9h18M3 9v11a1 1 0 001 1h4V14h8v7h4a1 1 0 001-1V9"
      stroke={c}
      strokeWidth={2}
      fill="none"
    />
  ),

  chart: (c) => (
    <Polyline
      points="22,12 18,12 15,21 9,3 6,12 2,12"
      stroke={c}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
    />
  ),

  package: (c) => (
    <Path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke={c}
      strokeWidth={2}
      fill="none"
    />
  ),

  edit: (c) => (
    <>
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={c}
        strokeWidth={2}
        fill="none"
      />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  upload: (c) => (
    <>
      <Polyline points="16,16 12,12 8,16" stroke={c} strokeWidth={2} fill="none" />
      <Line x1={12} y1={12} x2={12} y2={21} stroke={c} strokeWidth={2} />
      <Path d="M20 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  settings: (c) => (
    <>
      <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={2} fill="none" />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={c}
        strokeWidth={2}
        fill="none"
      />
    </>
  ),

  pin: (c) => (
    <>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={c} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={10} r={3} stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  card: (c) => (
    <>
      <Rect x={1} y={4} width={22} height={16} rx={2} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M1 10h22" stroke={c} strokeWidth={2} />
    </>
  ),

  gift: (c) => (
    <>
      <Polyline points="20,12 20,22 4,22 4,12" stroke={c} strokeWidth={2} fill="none" />
      <Rect x={2} y={7} width={20} height={5} stroke={c} strokeWidth={2} fill="none" />
      <Line x1={12} y1={22} x2={12} y2={7} stroke={c} strokeWidth={2} />
      <Path
        d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"
        stroke={c}
        strokeWidth={2}
        fill="none"
      />
    </>
  ),

  signOut: (c) => (
    <Path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      stroke={c}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
  ),

  shield: (c) => (
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={2} fill="none" />
  ),

  dollar: (c) => (
    <>
      <Line x1={12} y1={1} x2={12} y2={23} stroke={c} strokeWidth={2} />
      <Path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  eye: (c) => (
    <>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={c} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  chevronRight: (c) => (
    <Polyline points="9,18 15,12 9,6" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
  ),

  minus: (c) => <Path d="M5 12h14" stroke={c} strokeWidth={2} strokeLinecap="round" />,

  trash: (c) => (
    <>
      <Polyline points="3,6 5,6 21,6" stroke={c} strokeWidth={2} fill="none" />
      <Path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke={c} strokeWidth={2} fill="none" />
    </>
  ),

  share: (c) => (
    <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke={c} strokeWidth={2} fill="none" />
  ),

  filter: (c) => (
    <Polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke={c} strokeWidth={2} fill="none" />
  ),
};

export function Icon({ name, size = 22, color = '#ffffff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {GLYPHS[name](color)}
    </Svg>
  );
}
