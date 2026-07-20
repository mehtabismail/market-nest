-- Remaining RLS policies for commerce tables

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_variants_public_read ON product_variants;
CREATE POLICY product_variants_public_read ON product_variants
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM products
      WHERE products.id = product_variants.product_id
        AND products.status = 'published'
    )
  );

DROP POLICY IF EXISTS carts_select_own ON carts;
DROP POLICY IF EXISTS carts_write_own ON carts;
CREATE POLICY carts_select_own ON carts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY carts_write_own ON carts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cart_items_select_own ON cart_items;
DROP POLICY IF EXISTS cart_items_write_own ON cart_items;
CREATE POLICY cart_items_select_own ON cart_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );
CREATE POLICY cart_items_write_own ON cart_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS order_items_buyer_read ON order_items;
CREATE POLICY order_items_buyer_read ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.buyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payments_buyer_read ON payments;
CREATE POLICY payments_buyer_read ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.id = payments.order_id
        AND orders.buyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payouts_seller_read ON payouts;
CREATE POLICY payouts_seller_read ON payouts
  FOR SELECT TO authenticated
  USING (
    seller_id IN (
      SELECT sellers.id
      FROM sellers
      WHERE sellers.user_id = auth.uid()
    )
  );
