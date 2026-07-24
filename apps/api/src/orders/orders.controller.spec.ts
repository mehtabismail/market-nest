import type { Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@marketnest/shared-types';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { OrdersController, SellerOrdersController } from './orders.controller';

/**
 * Locks the role boundaries on the order surface.
 *
 * Buyer routes are for customers — buyers and sellers both, since a seller is a
 * buyer who also sells and keeps full shopping ability. The hard line is
 * superadmin: an admin who can place orders, read every order and trigger
 * payouts has no separation of duties, and admin-placed orders would land in
 * GMV/revenue analytics.
 */
describe('Order controller role boundaries', () => {
  const reflector = new Reflector();
  const rolesOn = (target: Type<unknown>) => reflector.get<UserRole[]>(ROLES_KEY, target);

  it('opens buyer order routes to customers (buyers and sellers)', () => {
    expect(rolesOn(OrdersController)).toEqual(['buyer', 'seller']);
  });

  it('does not allow superadmin to transact as a customer', () => {
    expect(rolesOn(OrdersController)).not.toContain('superadmin');
  });

  it('restricts seller order routes to sellers only', () => {
    expect(rolesOn(SellerOrdersController)).toEqual(['seller']);
  });
});
