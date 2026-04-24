'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from "next/navigation";

/* ─── Types ─── */
interface RawOrder {
  total: number;
  orderid: string;
  orderdetail: string;
  employeeid: string | null;
  employeetip: string | null;
  orderdate: string;   // e.g. "2026-02-25" or "2/25/2026"
  ordertime: string;   // e.g. "20:15"
}

interface ParsedDrink {
  name: string;
  size: string;
  sugar: string;
  ice: string;
  toppings: string[];
  quantity: number;
}

interface Order {
  orderid: string;
  total: number;
  orderdate: string;
  ordertime: string;
  drinks: ParsedDrink[];
}

/* ─── Helpers ─── */

/** Parse the orderdetail string:  "Black Milk Tea, Medium, 100%, Regular, lycheeJelly, grassJelly" */
function parseDrink(detail: string): ParsedDrink {
  const [base, qtyPart] = detail.split(" x");
  const quantity = qtyPart ? parseInt(qtyPart) : 1;

  const parts = base.split(',').map(s => s.trim());

  return {
    name: parts[0] ?? 'Unknown',
    size: parts[1] ?? '',
    sugar: parts[2] ?? '',
    ice: parts[3] ?? '',
    toppings: parts.slice(4).filter(Boolean),
    quantity,
  };
}

function groupOrders(rows: RawOrder[]): Order[] {
  const map = new Map<string, Order>();

  for (const row of rows) {
    if (!map.has(row.orderid)) {
      map.set(row.orderid, {
        orderid: row.orderid,
        total: row.total,
        orderdate: row.orderdate,
        ordertime: row.ordertime,
        drinks: [],
      });
    }

    const drinkStrings = row.orderdetail.split(' | ');

    drinkStrings.forEach((d) => {
      map.get(row.orderid)!.drinks.push(parseDrink(d));
    });
  }

  return Array.from(map.values());
}

/** Human-readable sugar label */
function sugarLabel(s: string): string {
  switch (s) {
    case '100%': return '100% Sugar';
    case '75%':  return '75% Sugar';
    case '50%':  return '50% Sugar';
    case '25%':  return '25% Sugar';
    case '0%':   return 'No Sugar';
    default:     return s;
  }
}

/** Compute minutes elapsed since order was placed */
function minutesAgo(dateStr: string, timeStr: string): number {
  // Normalize date — could be "2/25/2026" or "2026-02-25"
  const orderDate = new Date(`${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`);
  if (isNaN(orderDate.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - orderDate.getTime()) / 60000));
}

function formatElapsed(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function urgencyColor(mins: number): string {
  if (mins >= 30) return '#ef4444';   // red — very late
  if (mins >= 15) return '#f59e0b';   // amber — getting long
  return '#22c55e';                    // green — fresh
}

/* ─── Constants ─── */
const POLL_INTERVAL = 10_000; // 10 seconds

/* ─── Component ─── */
export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now()); // for elapsed-time updates
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/kitchen');
      if (!res.ok) throw new Error('fetch failed');
      const data: RawOrder[] = await res.json();
      setOrders(groupOrders(data));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for new orders
  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchOrders]);

  // Tick every 30s to keep elapsed times fresh
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function completeOrder(orderid: string) {
    if (completing) return; // prevent double-clicks
    setCompleting(orderid);
    try {
      const res = await fetch('/api/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderid }),
      });
      if (!res.ok) throw new Error('complete failed');
      // Optimistically remove it, then refetch
      setOrders(prev => prev.filter(o => o.orderid !== orderid));
      fetchOrders();
    } catch (err) {
      console.error('Failed to complete order:', err);
      alert('Error completing order. Please try again.');
    } finally {
      setCompleting(null);
    }
  }

  /* ─── Render ─── */
  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <button
          onClick={() => router.push("/")}
          style={styles.backBtn}
        >
          ← Back to Portal
        </button>

        <h1 style={styles.title}>Kitchen Display</h1>

        <span style={styles.badge}>
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </header>

      {loading ? (
        <p style={styles.loadingText}>Loading orders…</p>
      ) : orders.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={{ fontSize: 48 }}>✅</span>
          <p style={{ marginTop: 12, fontSize: 20, color: '#64748b' }}>All caught up — no orders in queue</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {orders.map(order => {
            const elapsed = minutesAgo(order.orderdate, order.ordertime);
            const color = urgencyColor(elapsed);
            const isCompleting = completing === order.orderid;

            return (
              <div key={order.orderid} style={styles.card}>
                {/* Card header */}
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.orderId}>{order.orderid}</span>
                    <span style={{ ...styles.elapsed, color }}>{formatElapsed(elapsed)}</span>
                  </div>
                  <span style={styles.drinkCount}>
                    {order.drinks.length} drink{order.drinks.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Drink list */}
                <div style={styles.drinkList}>
                  {order.drinks.map((drink, i) => (
                    <div key={i} style={styles.drinkItem}>
                      <div style={styles.drinkName}>
                        {drink.name} {drink.quantity > 1 && `×${drink.quantity}`}
                        <span style={styles.sizeBadge}>{drink.size}</span>
                      </div>
                      <div style={styles.drinkMeta}>
                        <span>{sugarLabel(drink.sugar)}</span>
                        <span style={styles.metaSep}>·</span>
                        <span>{drink.ice} Ice</span>
                      </div>
                      {drink.toppings.length > 0 && (
                        <div style={styles.toppings}>
                          {drink.toppings.map((t, j) => (
                            <span key={j} style={styles.toppingChip}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Complete button */}
                <button
                  onClick={() => completeOrder(order.orderid)}
                  disabled={isCompleting}
                  style={{
                    ...styles.completeBtn,
                    opacity: isCompleting ? 0.6 : 1,
                    cursor: isCompleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isCompleting ? 'Completing…' : '✓  Mark Complete'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: '24px 32px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  backBtn: {
    background: "#334155",
    color: "#e2e8f0",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  badge: {
    background: '#334155',
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
  },
  loadingText: {
    textAlign: 'center' as const,
    marginTop: 80,
    fontSize: 18,
    color: '#94a3b8',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#1e293b',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 18,
    fontWeight: 700,
    marginRight: 10,
  },
  elapsed: {
    fontSize: 14,
    fontWeight: 600,
  },
  drinkCount: {
    fontSize: 13,
    color: '#94a3b8',
    flexShrink: 0,
  },
  drinkList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    flex: 1,
  },
  drinkItem: {
    background: '#0f172a',
    borderRadius: 10,
    padding: '12px 14px',
  },
  drinkName: {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sizeBadge: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    background: '#334155',
    padding: '2px 8px',
    borderRadius: 6,
    letterSpacing: '0.04em',
  },
  drinkMeta: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
  },
  metaSep: {
    margin: '0 6px',
  },
  toppings: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  toppingChip: {
    fontSize: 12,
    background: '#7c3aed33',
    color: '#c4b5fd',
    padding: '2px 10px',
    borderRadius: 12,
    fontWeight: 500,
  },
  completeBtn: {
    width: '100%',
    padding: '12px 0',
    background: '#22c55e',
    color: '#052e16',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
};
