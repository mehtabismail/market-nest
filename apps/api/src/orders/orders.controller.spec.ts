import type { Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@marketnest/shared-types';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { OrdersController, SellerOrdersController } from './orders.controller';

/**
 * Locks the role boundaries on the order surface.
 *
 * Buyer routes must stay buyer-only: an admin who can place orders, read every
 * order and trigger payouts has no separation of duties, and admin-placed
 * orders would land in GMV/revenue analytics.
 */
describe('Order controller role boundaries', () => {
  const reflector = new Reflector();
  const rolesOn = (target: Type<unknown>) => reflector.get<UserRole[]>(ROLES_KEY, target);

  it('restricts buyer order routes to buyers only', () => {
    expect(rolesOn(OrdersController)).toEqual(['buyer']);
  });

  it('does not allow superadmin to transact as a customer', () => {
    expect(rolesOn(OrdersController)).not.toContain('superadmin');
  });

  it('restricts seller order routes to sellers only', () => {
    expect(rolesOn(SellerOrdersController)).toEqual(['seller']);
  });
});
