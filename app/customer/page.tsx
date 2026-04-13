'use client';

import { useState, useEffect } from 'react';

type View = 'welcome' | 'menu' | 'confirm' | 'receipt';

interface MenuItem {
  name: string;
  price: number;
}

const CATEGORIES = [
  { label: 'All',      emoji: null },
  { label: 'Milk Tea', emoji: '🍵' },
  { label: 'Fruit Tea',emoji: '🍓' },
  { label: 'Matcha',   emoji: '🌿' },
  { label: 'Slush',    emoji: '🧊' },
  { label: 'Seasonal', emoji: '🌸' },
];

export default function CustomerKiosk() {
  const [view, setView]                     = useState<View>('welcome');
  const [menu, setMenu]                     = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (view === 'menu' && menu.length === 0) {
      fetch('/api/menu').then(r => r.json()).then(setMenu);
    }
  }, [view, menu.length]);

  const filteredMenu = activeCategory === 'All'
    ? menu
    : activeCategory === 'Seasonal'
    ? menu.filter(item => item.name.toLowerCase().includes('seasonal'))
    : menu.filter(item =>
        item.name.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0])
      );

  if (view === 'welcome') return <WelcomeScreen onStart={() => setView('menu')} />;

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
            <button key={item.name} style={styles.itemCard}>
              <span style={styles.itemName}>{item.name}</span>
              <span style={styles.itemPrice}>from ${item.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.cartPanel}>
        <h2 style={styles.cartTitle}>Your Order</h2>
        <p style={styles.cartEmpty}>No items yet.<br />Tap a drink to add it.</p>
      </div>
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
};
