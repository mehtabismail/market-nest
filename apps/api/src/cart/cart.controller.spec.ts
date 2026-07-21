import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { CartController } from './cart.controller';

/**
 * Regression guard for the class-level @Public() bypass.
 *
 * JwtAuthGuard resolves IS_PUBLIC_KEY via getAllAndOverride([handler, class]).
 * A class-level @Public() therefore leaks into every handler and silently
 * disables the guard on routes that explicitly declare @UseGuards(JwtAuthGuard).
 * These assertions reproduce that exact lookup.
 */
describe('CartController auth metadata', () => {
  const reflector = new Reflector();

  const resolveIsPublic = (handler: unknown) =>
    reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler as Parameters<Reflector['getAllAndOverride']>[1][number],
      CartController,
    ]);

  it('does not declare @Public() at the class level', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CartController)).toBeUndefined();
  });

  it('treats POST /cart/merge as protected', () => {
    expect(resolveIsPublic(CartController.prototype.merge)).not.toBe(true);
  });

  it.each([
    ['getCart', CartController.prototype.getCart],
    ['addItem', CartController.prototype.addItem],
    ['updateItem', CartController.prototype.updateItem],
    ['removeItem', CartController.prototype.removeItem],
    ['createGuestSession', CartController.prototype.createGuestSession],
  ])('keeps %s reachable for guests', (_name, handler) => {
    expect(resolveIsPublic(handler)).toBe(true);
  });
});
