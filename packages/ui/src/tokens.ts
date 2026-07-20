/**
 * Design tokens from MarketNest_UI_Designs.html
 */
export const colors = {
  purple: '#534AB7',
  purpleLight: '#EEEDFE',
  purpleDark: '#3C3489',
  teal: '#0F6E56',
  tealLight: '#E1F5EE',
  tealDark: '#085041',
  blue: '#185FA5',
  blueLight: '#E6F1FB',
  coral: '#D85A30',
  coralLight: '#FAECE7',
  amber: '#BA7517',
  amberLight: '#FAEEDA',
  green: '#3B6D11',
  greenLight: '#EAF3DE',
  gray: '#5F5E5A',
  grayLight: '#F1EFE8',
  grayDark: '#2C2C2A',
  border: '#D3D1C7',
  white: '#FFFFFF',
  bg: '#F8F7F4',
} as const;

export const fonts = {
  heading: 'var(--font-syne), Syne, sans-serif',
  body: 'var(--font-dm-sans), "DM Sans", sans-serif',
  mono: 'var(--font-dm-mono), "DM Mono", monospace',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
} as const;

export const portalAccent = {
  buyer: colors.blue,
  seller: colors.teal,
  admin: colors.purple,
} as const;
