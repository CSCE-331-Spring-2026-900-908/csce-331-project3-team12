'use client';

import { useState, useEffect } from 'react';

type View = 'welcome' | 'menu' | 'confirm' | 'receipt';

interface MenuItem {
  name: string;
  price: number;
}

interface CustomizedItem {
  name: string;
  size: string;
  sugar: string;
  ice: string;
  toppings: string[];
  price: number;
}

const CATEGORIES = [
  { label: 'All',       emoji: null },
  { label: 'Milk Tea',  emoji: '🍵' },
  { label: 'Fruit Tea', emoji: '🍓' },
  { label: 'Matcha',    emoji: '🌿' },
  { label: 'Slush',     emoji: '🧊' },
  { label: 'Seasonal',  emoji: '🌸' },
];

const SIZES = [
  { label: 'Small',  modifier: 0 },
  { label: 'Medium', modifier: 0.5 },
  { label: 'Large',  modifier: 1.0 },
];

const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];
const ICE_LEVELS   = ['No Ice', 'Less Ice', 'Regular', 'Extra Ice'];

const TOPPING_PRICE = 0.50;

const TAX_RATE = 0.08;

export default function CustomerKiosk() {
  const [view, setView]                     = useState<View>('welcome');
  const [menu, setMenu]                     = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart]                     = useState<CustomizedItem[]>([]);
  const [orderId, setOrderId]               = useState<number | null>(null);

  const [customizing, setCustomizing]       = useState<MenuItem | null>(null);
  const [selSize, setSelSize]               = useState(SIZES[1].label);
  const [selSugar, setSelSugar]             = useState('75%');
  const [selIce, setSelIce]                 = useState('Regular');
  const [selToppings, setSelToppings]       = useState<string[]>([]);
  const [availableToppings, setAvailableToppings] = useState<string[]>([]);

  useEffect(() => {
    if (view === 'menu' && menu.length === 0) {
      fetch('/api/menu').then(r => r.json()).then(setMenu);
    }
  }, [view, menu.length]);

  useEffect(() => {
    fetch('/api/toppings')
      .then(r => r.json())
      .then((data: { ingredientname: string }[]) =>
        setAvailableToppings(data.map(d => d.ingredientname))
      )
      .catch(() => setAvailableToppings([]));
  }, []);

  const filteredMenu = activeCategory === 'All'
    ? menu
    : activeCategory === 'Seasonal'
    ? menu.filter(item => item.name.toLowerCase().includes('seasonal'))
    : menu.filter(item =>
        item.name.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0])
      );

  const subtotal = cart.reduce((s, i) => s + i.price, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  function itemPrice(base: number, size: string, toppings: string[]) {
    const sizeMod    = SIZES.find(s => s.label === size)?.modifier ?? 0;
    const toppingMod = toppings.length * TOPPING_PRICE;
    return base + sizeMod + toppingMod;
  }

  function openCustomize(item: MenuItem) {
    setCustomizing(item);
    setSelSize(SIZES[1].label);
    setSelSugar('75%');
    setSelIce('Regular');
    setSelToppings([]);
  }

  function confirmCustomize() {
    if (!customizing) return;
    setCart(prev => [...prev, {
      name:     customizing.name,
      size:     selSize,
      sugar:    selSugar,
      ice:      selIce,
      toppings: selToppings,
      price:    itemPrice(customizing.price, selSize, selToppings),
    }]);
    setCustomizing(null);
  }

  function toggleTopping(label: string) {
    setSelToppings(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  }

  function removeFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index));
  }

  async function placeOrder() {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, total }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrderId(data.orderId);
      setCart([]);
      setView('receipt');
    } else {
      alert('Something went wrong. Please try again.');
    }
  }

  if (view === 'welcome') return <WelcomeScreen onStart={() => setView('menu')} />;
  if (view === 'receipt') return (
    <ReceiptScreen orderId={orderId!} onDone={() => { setView('welcome'); setOrderId(null); }} />
  );

  return (
    <div style={styles.shell}>
      <div style={styles.menuArea}>
        <div style={styles.menuHeader}>
          <span style={styles.logo}>🧋 Boba Shop</span>
          <span style={styles.headerSub}>Tap a drink to customize</span>
        </div>

        <div style={styles.tabs}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              style={{
                ...styles.tab,
                background: activeCategory === cat.label ? '#7c3aed' : '#f3f0ff',
                color:      activeCategory === cat.label ? '#fff'    : '#4c1d95',
                fontWeight: activeCategory === cat.label ? 700       : 500,
              }}
            >
              {cat.emoji && <span style={{ fontSize: 22 }}>{cat.emoji}</span>}
              {cat.label}
            </button>
          ))}
        </div>

        <div style={styles.grid}>
          {filteredMenu.map(item => (
            <button key={item.name} onClick={() => openCustomize(item)} style={styles.itemCard}>
              <span style={styles.itemName}>{item.name}</span>
              <span style={styles.itemPrice}>from ${item.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div style={styles.cartPanel}>
        <h2 style={styles.cartTitle}>Your Order</h2>

        {cart.length === 0 ? (
          <p style={styles.cartEmpty}>No items yet.<br />Tap a drink to add it.</p>
        ) : (
          <div style={styles.cartList}>
            {cart.map((item, i) => (
              <div key={i} style={styles.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cartItemName}>{item.name}</div>
                  <div style={styles.cartItemMeta}>
                    {item.size} · {item.sugar} sugar · {item.ice}
                    {item.toppings.length > 0 && <> · {item.toppings.join(', ')}</>}
                  </div>
                </div>
                <div style={styles.cartItemRight}>
                  <span style={styles.cartItemPrice}>${item.price.toFixed(2)}</span>
                  <button onClick={() => removeFromCart(i)} style={styles.removeBtn}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.totals}>
          <div style={styles.totalRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div style={styles.totalRow}><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
          <div style={{ ...styles.totalRow, ...styles.totalBold }}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => cart.length > 0 && setView('confirm')}
          disabled={cart.length === 0}
          style={{ ...styles.checkoutBtn, opacity: cart.length === 0 ? 0.4 : 1 }}
        >
          Review Order →
        </button>
      </div>

      {/* Customize Modal */}
      {customizing && (
        <div style={styles.overlay} onClick={() => setCustomizing(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{customizing.name}</h2>
            <p style={styles.modalBase}>Base price: ${customizing.price.toFixed(2)}</p>

            <OptionGroup label="Size">
              {SIZES.map(s => (
                <Chip
                  key={s.label}
                  label={`${s.label}${s.modifier > 0 ? ` +$${s.modifier.toFixed(2)}` : ''}`}
                  selected={selSize === s.label}
                  onClick={() => setSelSize(s.label)}
                />
              ))}
            </OptionGroup>

            <OptionGroup label="Sugar Level">
              {SUGAR_LEVELS.map(s => (
                <Chip key={s} label={s} selected={selSugar === s} onClick={() => setSelSugar(s)} />
              ))}
            </OptionGroup>

            <OptionGroup label="Ice Level">
              {ICE_LEVELS.map(s => (
                <Chip key={s} label={s} selected={selIce === s} onClick={() => setSelIce(s)} />
              ))}
            </OptionGroup>

            <OptionGroup label="Toppings">
              {availableToppings.map(t => (
                <Chip
                  key={t}
                  label={`${t} +$${TOPPING_PRICE.toFixed(2)}`}
                  selected={selToppings.includes(t)}
                  onClick={() => toggleTopping(t)}
                  multi
                />
              ))}
            </OptionGroup>

            <div style={styles.modalFooter}>
              <span style={styles.modalTotal}>
                ${itemPrice(customizing.price, selSize, selToppings).toFixed(2)}
              </span>
              <button onClick={() => setCustomizing(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={confirmCustomize} style={styles.addBtn}>Add to Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {view === 'confirm' && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 480 }}>
            <h2 style={styles.modalTitle}>Confirm Order</h2>
            <div style={{ marginBottom: 20 }}>
              {cart.map((item, i) => (
                <div key={i} style={styles.confirmRow}>
                  <span>{item.name} ({item.size})</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ ...styles.totalRow, ...styles.totalBold, marginBottom: 28 }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setView('menu')} style={styles.cancelBtn}>← Back</button>
              <button onClick={placeOrder} style={{ ...styles.addBtn, flex: 1 }}>Place Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={styles.welcome} onClick={onStart}>
      <div style={styles.welcomeInner}>
        <div style={styles.welcomeEmoji}>🧋</div>
        <h1 style={styles.welcomeTitle}>Welcome to Boba Shop</h1>
        <p style={styles.welcomeSub}>Fresh boba made to order</p>
        <div style={styles.tapPrompt}>Tap anywhere to start</div>
      </div>
    </div>
  );
}

function ReceiptScreen({ orderId, onDone }: { orderId: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 8000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={styles.welcome}>
      <div style={styles.welcomeInner}>
        <div style={styles.welcomeEmoji}>✅</div>
        <h1 style={styles.welcomeTitle}>Order Placed!</h1>
        <p style={styles.welcomeSub}>Your order number is</p>
        <div style={styles.orderNumber}>#{orderId}</div>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 24, fontSize: 18 }}>
          We'll have it ready soon. Thank you!
        </p>
        <button onClick={onDone} style={{ ...styles.addBtn, marginTop: 32, padding: '14px 40px', fontSize: 16 }}>
          New Order
        </button>
      </div>
    </div>
  );
}

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={styles.optionLabel}>{label}</div>
      <div style={styles.optionRow}>{children}</div>
    </div>
  );
}

function Chip({ label, selected, onClick, multi = false }: {
  label: string; selected: boolean; onClick: () => void; multi?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      ...styles.chip,
      background: selected ? '#7c3aed' : '#f3f0ff',
      color:      selected ? '#fff'    : '#4c1d95',
      border:     selected ? '2px solid #7c3aed' : '2px solid #ddd6fe',
      fontWeight: selected ? 700 : 500,
    }}>
      {multi && <span style={{ marginRight: 4 }}>{selected ? '✓' : '+'}</span>}
      {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    background: '#faf7ff',
    overflow: 'hidden',
  },
  menuArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 28px',
    overflowY: 'auto',
  },
  menuHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 16,
    marginBottom: 24,
  },
  logo: {
    fontSize: 28,
    fontWeight: 800,
    color: '#4c1d95',
    letterSpacing: '-0.02em',
  },
  headerSub: {
    fontSize: 15,
    color: '#9ca3af',
  },
  tabs: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 22px',
    borderRadius: 50,
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
  },
  itemCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '24px 16px',
    borderRadius: 20,
    border: '2px solid #ede9fe',
    background: '#fff',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(124,58,237,0.06)',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1f2937',
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: 600,
  },
  cartPanel: {
    width: 340,
    background: '#fff',
    borderLeft: '1px solid #ede9fe',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
  },
  cartTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#4c1d95',
    margin: '0 0 16px 0',
  },
  cartEmpty: {
    flex: 1,
    color: '#9ca3af',
    fontSize: 15,
    lineHeight: 1.6,
    textAlign: 'center',
    marginTop: 40,
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  cartItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    background: '#faf7ff',
    borderRadius: 12,
    padding: '10px 12px',
  },
  cartItemName: {
    fontWeight: 700,
    fontSize: 14,
    color: '#1f2937',
  },
  cartItemMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 1.5,
  },
  cartItemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  cartItemPrice: {
    fontWeight: 700,
    fontSize: 14,
    color: '#7c3aed',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: 12,
    padding: 0,
  },
  totals: {
    borderTop: '1px solid #ede9fe',
    paddingTop: 14,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 15,
    color: '#374151',
  },
  totalBold: {
    fontWeight: 700,
    fontSize: 18,
    color: '#4c1d95',
  },
  checkoutBtn: {
    width: '100%',
    padding: '16px 0',
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24,
  },
  modal: {
    background: '#fff',
    borderRadius: 24,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 540,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#4c1d95',
    margin: '0 0 4px 0',
  },
  modalBase: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    padding: '8px 16px',
    borderRadius: 50,
    cursor: 'pointer',
    fontSize: 14,
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    borderTop: '1px solid #ede9fe',
    paddingTop: 20,
  },
  modalTotal: {
    fontSize: 22,
    fontWeight: 800,
    color: '#7c3aed',
    marginRight: 'auto',
  },
  cancelBtn: {
    padding: '12px 20px',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  addBtn: {
    padding: '12px 24px',
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: 15,
    color: '#374151',
  },
  welcome: {
    height: '100vh',
    background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  welcomeInner: {
    textAlign: 'center',
    color: '#fff',
  },
  welcomeEmoji: {
    fontSize: 96,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 52,
    fontWeight: 900,
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
  },
  welcomeSub: {
    fontSize: 22,
    opacity: 0.8,
    marginBottom: 48,
  },
  tapPrompt: {
    display: 'inline-block',
    padding: '16px 40px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    fontSize: 20,
    fontWeight: 600,
    border: '2px solid rgba(255,255,255,0.4)',
  },
  orderNumber: {
    fontSize: 72,
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#fde68a',
  },
};
