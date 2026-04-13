'use client';

import { useState } from 'react';

type View = 'welcome' | 'menu' | 'confirm' | 'receipt';

export default function CustomerKiosk() {
  const [view, setView] = useState<View>('welcome');

  if (view === 'welcome') return <WelcomeScreen onStart={() => setView('menu')} />;

  return (
    <div style={styles.shell}>
      <div style={styles.menuArea}>
        <div style={styles.menuHeader}>
          <span style={styles.logo}>🧋 Boba Shop</span>
          <span style={styles.headerSub}>Tap a drink to customize</span>
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
