/**
 * Maps notification `link` + `type` to a navigable path per client.
 * API stores portable paths (`/orders/:id`, `/kyc`, `/admin/kyc`, `/seller/orders`).
 */

export type NotificationPortal = 'buyer' | 'seller' | 'admin' | 'mobile';

export function resolveNotificationHref(input: {
  type: string;
  link?: string | null;
  /** Which surface is resolving the tap. */
  portal: NotificationPortal;
}): string | null {
  const raw = input.link?.trim() || null;
  const mapped = raw ? mapStoredLink(raw, input.portal) : null;
  if (mapped) return mapped;
  return fallbackByType(input.type, input.portal);
}

function mapStoredLink(link: string, portal: NotificationPortal): string | null {
  // Absolute URLs are left alone (rare).
  if (/^https?:\/\//i.test(link)) return link;

  const path = link.startsWith('/') ? link : `/${link}`;

  if (portal === 'mobile') {
    if (path.startsWith('/admin/')) return null;
    if (path === '/seller/products' || path.startsWith('/seller/products/')) return '/kyc';
    if (path === '/seller/kyc' || path === '/kyc') return '/kyc';
    if (path.startsWith('/seller/orders')) return '/seller/orders';
    if (path.startsWith('/seller/payouts') || path.startsWith('/seller/earnings')) {
      return '/seller/payouts';
    }
    if (path.startsWith('/shop/orders/')) {
      return path.replace('/shop/orders/', '/orders/');
    }
    if (path === '/shop/orders') return '/orders';
    if (path.startsWith('/orders/') || path === '/orders') return path;
    if (path.startsWith('/rewards') || path.startsWith('/wishlist') || path.startsWith('/seller/')) {
      return path;
    }
    // Unknown absolute app path — try as-is.
    return path;
  }

  if (portal === 'buyer') {
    if (path.startsWith('/orders/')) return `/shop${path}`;
    if (path === '/orders') return '/shop/orders';
    if (path.startsWith('/shop/')) return path;
    if (path.startsWith('/rewards')) return '/shop'; // no dedicated rewards page on web yet
    return path.startsWith('/admin/') || path.startsWith('/seller/') ? null : path;
  }

  if (portal === 'seller') {
    if (path === '/kyc' || path === '/seller/kyc') return '/seller/kyc';
    if (path === '/seller/products' || path.startsWith('/seller/')) return path;
    if (path.startsWith('/orders/')) return '/seller/orders';
    return path.startsWith('/admin/') ? null : path;
  }

  // admin
  if (path.startsWith('/admin/')) return path;
  if (path === '/kyc' || path.includes('kyc')) return '/admin/kyc';
  return path.startsWith('/') ? path : null;
}

function fallbackByType(type: string, portal: NotificationPortal): string | null {
  switch (type) {
    case 'kyc':
      if (portal === 'admin') return '/admin/kyc';
      if (portal === 'mobile') return '/kyc';
      if (portal === 'seller') return '/seller/kyc';
      return null;
    case 'order_update':
      if (portal === 'mobile') return '/orders';
      if (portal === 'buyer') return '/shop/orders';
      if (portal === 'seller') return '/seller/orders';
      return null;
    case 'payout':
      if (portal === 'mobile') return '/seller/payouts';
      if (portal === 'seller') return '/seller/earnings';
      return null;
    case 'system':
      if (portal === 'mobile') return '/kyc';
      if (portal === 'seller') return '/seller/kyc';
      return null;
    case 'promotion':
      if (portal === 'mobile') return '/rewards';
      if (portal === 'buyer') return '/shop';
      return null;
    default:
      return null;
  }
}
