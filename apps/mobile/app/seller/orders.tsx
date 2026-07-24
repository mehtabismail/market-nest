import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@marketnest/api-client';
import { Icon } from '../../src/components/icon';
import { PressableScale } from '../../src/components/pressable-scale';
import { ScreenHeader } from '../../src/components/screen-header';
import { useTheme } from '../../src/contexts/theme-context';
import { api } from '../../src/lib/api';
import { font, formatPrice, radii, size, statusColors } from '../../src/theme';

/** Shape from GET /seller/orders */
interface SellerOrderItem {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  status: string;
  trackingNumber: string | null;
  courierName: string | null;
}

interface SellerOrder {
  orderId: string;
  status: string;
  createdAt: string;
  buyerName?: string;
  buyerPhone?: string;
  paymentMethod?: string;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items: SellerOrderItem[];
  sellerTotal: number;
}

/** Valid seller-advanceable statuses */
const SELLER_STATUS_FLOW: Record<string, string[]> = {
  confirmed: ['processing'],
  processing: ['shipped'],
  shipped: ['delivered'],
};

export default function SellerOrdersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<SellerOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.request<SellerOrder[]>('/seller/orders');
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not load orders.');
      setOrders([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function advanceStatus(item: SellerOrderItem, newStatus: string) {
    if (newStatus === 'shipped') {
      promptShipping(item);
      return;
    }

    setUpdating(item.id);
    try {
      await api.request(`/seller/orders/items/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      void load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  }

  function promptShipping(item: SellerOrderItem) {
    // Tracking is issued by the courier when the seller books a shipment
    // (TCS, Leopards, FedEx, etc.) — MarketNest does not generate one.
    Alert.prompt(
      'Ship this item',
      'Enter the tracking number from your courier (the ID they gave you when you booked the parcel):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (trackingNumber: string | undefined) => {
            if (!trackingNumber?.trim()) {
              Alert.alert('Tracking required', 'Ask your courier for the tracking / AWB number, then try again.');
              return;
            }
            promptCourier(item, trackingNumber.trim());
          },
        },
      ],
      'plain-text',
      item.trackingNumber ?? '',
    );
  }

  function promptCourier(item: SellerOrderItem, trackingNumber: string) {
    Alert.prompt(
      'Courier name',
      'Which company is delivering it? e.g. TCS, Leopards, Call Courier, FedEx, DHL',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as shipped',
          onPress: async (courierName: string | undefined) => {
            if (!courierName?.trim()) {
              Alert.alert('Courier required', 'Enter the courier / shipping company name.');
              return;
            }
            setUpdating(item.id);
            try {
              await api.request(`/seller/orders/items/${item.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({
                  status: 'shipped',
                  trackingNumber,
                  courierName: courierName.trim(),
                }),
              });
              void load();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not update status.');
            } finally {
              setUpdating(null);
            }
          },
        },
      ],
      'plain-text',
      item.courierName ?? '',
    );
  }

  function getNextStatuses(currentStatus: string): string[] {
    return SELLER_STATUS_FLOW[currentStatus] ?? [];
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Orders"
        subtitle={orders ? `${orders.length} order${orders.length === 1 ? '' : 's'}` : 'Loading…'}
        back
        backFallback="/seller"
      />

      {orders === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyGlyph}>📦</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
            {error ?? 'Orders from buyers will appear here.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {orders.map((order) => {
            const expanded = expandedOrder === order.orderId;
            const statusColor = getStatusColor(order.status);

            return (
              <View
                key={order.orderId}
                style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <PressableScale
                  accessibilityRole="button"
                  onPress={() => setExpandedOrder(expanded ? null : order.orderId)}
                  style={styles.orderHeader}
                >
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <View style={styles.flex}>
                    <Text style={[styles.orderId, { color: theme.text }]}>
                      #{order.orderId.slice(0, 8)}
                    </Text>
                    <Text style={[styles.orderMeta, { color: theme.textMuted }]}>
                      {order.buyerName ?? 'Buyer'} · {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={[styles.orderTotal, { color: theme.accent }]}>
                      {formatPrice(order.sellerTotal)}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor}1a` }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {formatStatus(order.status)}
                      </Text>
                    </View>
                  </View>
                  <Icon
                    name="chevronRight"
                    size={14}
                    color={theme.textMuted}
                  />
                </PressableScale>

                {expanded && (
                  <View style={[styles.orderDetails, { borderTopColor: theme.border }]}>
                    {order.shippingAddress && (
                      <View style={styles.addressBlock}>
                        <Text style={[styles.addressLabel, { color: theme.textMuted }]}>
                          Shipping Address
                        </Text>
                        <Text style={[styles.addressText, { color: theme.text }]}>
                          {order.shippingAddress.line1}
                          {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
                        </Text>
                        <Text style={[styles.addressText, { color: theme.text }]}>
                          {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                          {order.shippingAddress.postalCode}
                        </Text>
                        {order.buyerPhone && (
                          <Text style={[styles.addressText, { color: theme.textMuted }]}>
                            📞 {order.buyerPhone}
                          </Text>
                        )}
                      </View>
                    )}

                    <Text style={[styles.itemsLabel, { color: theme.textMuted }]}>Items</Text>
                    {order.items.map((item) => {
                      const nextStatuses = getNextStatuses(item.status);
                      const isUpdating = updating === item.id;
                      const itemStatusColor = getStatusColor(item.status);

                      return (
                        <View
                          key={item.id}
                          style={[styles.itemRow, { borderColor: theme.border }]}
                        >
                          <View style={styles.flex}>
                            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={[styles.itemMeta, { color: theme.textMuted }]}>
                              Qty: {item.quantity} · {formatPrice(item.unitPrice * item.quantity)}
                            </Text>
                            {item.trackingNumber && (
                              <Text style={[styles.trackingText, { color: theme.textFaint }]}>
                                🚚 {item.courierName}: {item.trackingNumber}
                              </Text>
                            )}
                          </View>

                          <View style={styles.itemActions}>
                            <View style={[styles.itemStatusPill, { backgroundColor: `${itemStatusColor}1a` }]}>
                              <Text style={[styles.itemStatusText, { color: itemStatusColor }]}>
                                {formatStatus(item.status)}
                              </Text>
                            </View>

                            {nextStatuses.length > 0 && (
                              <View style={styles.actionButtons}>
                                {nextStatuses.map((nextStatus) => (
                                  <PressableScale
                                    key={nextStatus}
                                    accessibilityRole="button"
                                    disabled={isUpdating}
                                    onPress={() => advanceStatus(item, nextStatus)}
                                    style={[
                                      styles.actionBtn,
                                      { backgroundColor: theme.accent, opacity: isUpdating ? 0.6 : 1 },
                                    ]}
                                  >
                                    {isUpdating ? (
                                      <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                      <Text style={styles.actionBtnText}>
                                        {nextStatus === 'processing'
                                          ? 'Process'
                                          : nextStatus === 'shipped'
                                            ? 'Ship'
                                            : 'Deliver'}
                                      </Text>
                                    )}
                                  </PressableScale>
                                ))}
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered':
      return statusColors.delivered;
    case 'shipped':
      return statusColors.shipped;
    case 'processing':
      return statusColors.processing;
    case 'confirmed':
      return statusColors.confirmed;
    case 'cancelled':
    case 'refunded':
      return statusColors.cancelled;
    default:
      return statusColors.processing;
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { paddingTop: 60, alignItems: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyGlyph: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: size.xl, fontFamily: font.display, marginBottom: 6 },
  emptyBody: {
    fontSize: size.body,
    fontFamily: font.body,
    textAlign: 'center',
    lineHeight: size.body * 1.5,
  },
  list: { paddingHorizontal: 20, gap: 12 },
  orderCard: { borderRadius: radii.tile, borderWidth: 1, overflow: 'hidden' },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  orderId: { fontSize: size.body, fontFamily: font.bodySemibold },
  orderMeta: { fontSize: size.caption, fontFamily: font.body, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4, marginRight: 8 },
  orderTotal: { fontSize: size.body, fontFamily: font.bodyBold },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.chip },
  statusText: { fontSize: size.micro, fontFamily: font.bodyBold, textTransform: 'capitalize' },
  orderDetails: { borderTopWidth: 1, padding: 14 },
  addressBlock: { marginBottom: 14 },
  addressLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 4 },
  addressText: { fontSize: size.small, fontFamily: font.body, lineHeight: size.small * 1.4 },
  itemsLabel: { fontSize: size.caption, fontFamily: font.bodySemibold, marginBottom: 8 },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemTitle: { fontSize: size.body, fontFamily: font.bodyMedium },
  itemMeta: { fontSize: size.caption, fontFamily: font.body, marginTop: 2 },
  trackingText: { fontSize: size.tiny, fontFamily: font.body, marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  itemStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.chip },
  itemStatusText: { fontSize: size.micro, fontFamily: font.bodyBold, textTransform: 'capitalize' },
  actionButtons: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.control,
    minWidth: 60,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: size.caption, fontFamily: font.bodyBold, color: '#ffffff' },
});
