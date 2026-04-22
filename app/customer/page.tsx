'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/useTranslation";
import { Lang } from "@/lib/translations";

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
  { key: 'sizeSmall',  modifier: 0 },
  { key: 'sizeMedium', modifier: 0.5 },
  { key: 'sizeLarge',  modifier: 1.0 },
];

const SIZE_LABELS: Record<string, string> = {
  sizeSmall: 'Small',
  sizeMedium: 'Medium',
  sizeLarge: 'Large',
};

const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];
const ICE_LEVELS = [
  { key: 'iceNoIce' },
  { key: 'iceLess' },
  { key: 'iceRegular' },
  { key: 'iceExtra' },
];



const TOPPING_PRICE = 0.50;
const TAX_RATE = 0.08;

export default function CustomerKiosk() {
  const { lang, setLang, t } = useTranslation("en");

  const [view, setView]                     = useState<View>('welcome');
  const [menu, setMenu]                     = useState<MenuItem[]>([]);
  const [translatedMenu, setTranslatedMenu] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart]                     = useState<CustomizedItem[]>([]);
  const [orderId, setOrderId]               = useState<number | null>(null);

  const [customizing, setCustomizing]       = useState<MenuItem | null>(null);
  const [selSize, setSelSize]               = useState(SIZES[1].key);
  const [selSugar, setSelSugar]             = useState('75%');
  const [selIce, setSelIce]                 = useState(ICE_LEVELS[2].key);
  const [selToppings, setSelToppings]       = useState<string[]>([]);
  const [finalOrder, setFinalOrder] = useState<CustomizedItem[]>([]);

  const [availableToppings, setAvailableToppings]   = useState<string[]>([]);
  const [translatedToppings, setTranslatedToppings] = useState<string[]>([]);
  const [translatedCategories, setTranslatedCategories] = useState<string[]>(
    CATEGORIES.map(c => c.label)
  );
  const [translating, setTranslating] = useState(false);

  // Fetch menu
  useEffect(() => {
    if (view === 'menu' && menu.length === 0) {
      fetch('/api/menu').then(r => r.json()).then(setMenu);
    }
  }, [view, menu.length]);

  // Fetch toppings
  useEffect(() => {
    fetch('/api/toppings')
      .then(r => r.json())
      .then((data: { ingredientname: string }[]) =>
        setAvailableToppings(data.map(d => d.ingredientname))
      )
      .catch(() => setAvailableToppings([]));
  }, []);

  // Translate all dynamic content whenever lang or source data changes
  useEffect(() => {
    if (lang === 'en') {
      setTranslatedMenu(menu);
      setTranslatedToppings(availableToppings);
      setTranslatedCategories(CATEGORIES.map(c => c.label));
      return;
    }
    if (menu.length === 0 && availableToppings.length === 0) return;

    async function translateAll() {
      setTranslating(true);
      try {
        const menuNames      = menu.map(i => i.name);
        const categoryLabels = CATEGORIES.map(c => c.label);
        const allStrings     = [...menuNames, ...availableToppings, ...categoryLabels];

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // /api/translate must accept { texts: string[], target: string }
          // and return { translatedTexts: string[] } in the same order
          body: JSON.stringify({ texts: allStrings, target: lang }),
        });

        if (!res.ok) throw new Error('Translation failed');
        const data = await res.json();
        const translated: string[] = data.translatedTexts;

        setTranslatedMenu(
          menu.map((item, i) => ({ ...item, name: translated[i] }))
        );
        setTranslatedToppings(
          translated.slice(menuNames.length, menuNames.length + availableToppings.length)
        );
        setTranslatedCategories(
          translated.slice(menuNames.length + availableToppings.length)
        );
      } catch (err) {
        console.error('Translation error:', err);
        setTranslatedMenu(menu);
        setTranslatedToppings(availableToppings);
        setTranslatedCategories(CATEGORIES.map(c => c.label));
      } finally {
        setTranslating(false);
      }
    }

    translateAll();
  }, [lang, menu, availableToppings]);

  const filteredMenu = (() => {
    const englishCategory =
      CATEGORIES[translatedCategories.indexOf(activeCategory)]?.label ?? activeCategory;
    const source = translatedMenu.length ? translatedMenu : menu;
    if (englishCategory === 'All') return source;
    if (englishCategory === 'Seasonal')
      return source.filter((_, i) => menu[i]?.name.toLowerCase().includes('seasonal'));
    return source.filter((_, i) =>
      menu[i]?.name.toLowerCase().includes(englishCategory.toLowerCase().split(' ')[0])
    );
  })();

  const subtotal = cart.reduce((s, i) => s + i.price, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  function itemPrice(base: number, size: string, toppings: string[]) {
    const sizeMod    = SIZES.find(s => s.key === size)?.modifier ?? 0;
    const toppingMod = toppings.length * TOPPING_PRICE;
    return base + sizeMod + toppingMod;
  }

  function openCustomize(item: MenuItem) {
    setCustomizing(item);
    setSelSize(SIZES[1].key);
    setSelSugar('75%');
    setSelIce(ICE_LEVELS[2].key);
    setSelToppings([]);
  }

  function confirmCustomize() {
    if (!customizing) return;

    // Store English name in cart so the backend always receives consistent data
    const translatedIndex = translatedMenu.findIndex(i => i.name === customizing.name);
    const englishName = translatedIndex >= 0 ? menu[translatedIndex].name : customizing.name;

    // Map translated topping names back to English
    const englishToppings = selToppings.map(top => {
      const idx = translatedToppings.indexOf(top);
      return idx >= 0 ? availableToppings[idx] : top;
    });

    setCart(prev => [...prev, {
      name:     englishName,
      size:     selSize,
      sugar:    selSugar,
      ice:      selIce,
      toppings: englishToppings,
      price:    itemPrice(customizing.price, selSize, selToppings),
    }]);
    setCustomizing(null);
  }

  function toggleTopping(label: string) {
    setSelToppings(prev =>
      prev.includes(label) ? prev.filter(top => top !== label) : [...prev, label]
    );
  }

  function removeFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index));
  }

  function translateTopping(name: string) {
    const idx = availableToppings.indexOf(name);
    return idx >= 0 ? (translatedToppings[idx] ?? name) : name;
  }

  function translateDrinkName(name: string) {
    const idx = menu.findIndex(m => m.name === name);
    return idx >= 0 ? (translatedMenu[idx]?.name ?? name) : name;
  }

  async function placeOrder() {
    const localizedItems = cart.map(item => ({
      name: translatedMenu.find(t => t.name === item.name)?.name ?? item.name,
      size: t(item.size as any),
      sugar: item.sugar,
      ice: t(item.ice as any),
      toppings: item.toppings.map(top =>
        translatedToppings.includes(top) ? top : top
      ),
      price: item.price,
    }));

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,              // backend version (English)
        localizedItems,           // display version (translated)
        total
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setFinalOrder(cart);   // 👈 save before clearing
      setOrderId(data.orderId);
      setCart([]);
      setView('receipt');
    } else {
      alert('Something went wrong. Please try again.');
    }
  }

  // ── Welcome ─────────────────────────────────────────────────────────────────
  if (view === 'welcome') {
    return (
      <div style={styles.welcome} onClick={() => setView('menu')}>
        <div style={styles.welcomeInner}>
          <div style={styles.welcomeEmoji}>🧋</div>
          <h1 style={styles.welcomeTitle}>{t('welcome')}</h1>
          <p style={styles.welcomeSub}>Fresh boba made to order</p>
          <div style={styles.tapPrompt}>{t('tapStart')}</div>
        </div>
      </div>
    );
  }

  // ── Receipt ─────────────────────────────────────────────────────────────────
  if (view === 'receipt') {
    return (
      <ReceiptScreen
        orderId={orderId!}
        items={finalOrder}
        lang={lang}
        onDone={() => {
          setView('welcome');
          setOrderId(null);
          setFinalOrder([]);
        }}
      />
    );
  }

  // ── Menu + Cart ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.shell}>
      <div style={styles.menuArea}>
        <div style={styles.menuHeader}>
          <span style={styles.logo}>🧋 Boba Shop</span>
          <span style={styles.headerSub}>{t('customize')}</span>

          <select
            value={lang}
            onChange={e => setLang(e.target.value as Lang)}
            style={{ marginLeft: 'auto', padding: '6px', borderRadius: 8, border: '1px solid #ddd6fe' }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="zh">中文</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        {/* Category tabs */}
        <div style={styles.tabs}>
          {CATEGORIES.map((cat, i) => {
            const label = translatedCategories[i] ?? cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(label)}
                style={{
                  ...styles.tab,
                  background: activeCategory === label ? '#7c3aed' : '#f3f0ff',
                  color:      activeCategory === label ? '#fff'    : '#4c1d95',
                  fontWeight: activeCategory === label ? 700       : 500,
                }}
              >
                {cat.emoji && <span style={{ fontSize: 22 }}>{cat.emoji}</span>}
                {label}
              </button>
            );
          })}
        </div>

        {translating && (
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 12 }}>Translating menu…</p>
        )}

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
        <h2 style={styles.cartTitle}>{t('yourOrder')}</h2>

        {cart.length === 0 ? (
          <p style={styles.cartEmpty}>{t('noItems')}</p>
        ) : (
          <div style={styles.cartList}>
            {cart.map((item, i) => (
              <div key={i} style={styles.cartItem}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cartItemName}>{item.name}</div>
                  <div style={styles.cartItemMeta}>
                    {t(item.size as any)} · {t(item.sugar as any)} {t('sugar')}· {t(item.ice as any)}
                    {item.toppings.length > 0 && <> · {item.toppings.map(translateTopping).join(', ')}</>}
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
          <div style={styles.totalRow}><span>{t('subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>
          <div style={styles.totalRow}><span>{t('tax')}</span><span>${tax.toFixed(2)}</span></div>
          <div style={{ ...styles.totalRow, ...styles.totalBold }}>
            <span>{t('total')}</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => cart.length > 0 && setView('confirm')}
          disabled={cart.length === 0}
          style={{ ...styles.checkoutBtn, opacity: cart.length === 0 ? 0.4 : 1 }}
        >
          {t('review')}
        </button>
      </div>

      {/* Customize Modal */}
      {customizing && (
        <div style={styles.overlay} onClick={() => setCustomizing(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{customizing.name}</h2>
            <p style={styles.modalBase}>{t("basePrice")}: ${customizing.price.toFixed(2)}</p>

            <OptionGroup label={t("size")} >
              {SIZES.map(s => (
                <Chip
                  key={s.key}
                  label={t(s.key as any)}
                  selected={selSize === s.key}
                  onClick={() => setSelSize(s.key)}
                />
              ))}
            </OptionGroup>

            <OptionGroup label={t('sugar')}>
              {SUGAR_LEVELS.map(s => (
                <Chip key={s} label={s} selected={selSugar === s} onClick={() => setSelSugar(s)} />
              ))}
            </OptionGroup>

            <OptionGroup label={t("ice")}>
              {ICE_LEVELS.map(i => (
                <Chip
                  key={i.key}
                  label={t(i.key as any)}
                  selected={selIce === i.key}
                  onClick={() => setSelIce(i.key)}
                />
              ))}
            </OptionGroup>

            <OptionGroup label={t('toppings')}>
              {(translatedToppings.length ? translatedToppings : availableToppings).map((top, i) => (
                <Chip
                  key={availableToppings[i] ?? top}
                  label={`${top} +$${TOPPING_PRICE.toFixed(2)}`}
                  selected={selToppings.includes(top)}
                  onClick={() => toggleTopping(top)}
                  multi
                />
              ))}
            </OptionGroup>

            <div style={styles.modalFooter}>
              <span style={styles.modalTotal}>
                ${itemPrice(customizing.price, selSize, selToppings).toFixed(2)}
              </span>
              <button onClick={() => setCustomizing(null)} style={styles.cancelBtn}>{t('cancel')}</button>
              <button onClick={confirmCustomize} style={styles.addBtn}>{t('addToOrder')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {view === 'confirm' && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 480 }}>
            <h2 style={styles.modalTitle}>{t('confirmOrder')}</h2>
            <div style={{ marginBottom: 20 }}>
              {cart.map((item, i) => (
                <div key={i} style={styles.confirmRow}>
                  <span>
                    {translateDrinkName(item.name)} ({t(item.size as any)})
                  </span>

                  <span>
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ ...styles.totalRow, ...styles.totalBold, marginBottom: 28 }}>
              <span>{t('total')}</span><span>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setView('menu')} style={styles.cancelBtn}>← Back</button>
              <button onClick={placeOrder} style={{ ...styles.addBtn, flex: 1 }}>{t('placeOrder')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReceiptScreen({orderId, items, onDone, lang}: {orderId: number; items: CustomizedItem[]; onDone: () => void; lang: Lang}) {
  const { t } = useTranslation(lang);
  useEffect(() => {
    const timer = setTimeout(onDone, 8000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div style={styles.welcome}>
      <div style={styles.welcomeInner}>
        <div style={styles.welcomeEmoji}>✅</div>
        <h1 style={styles.welcomeTitle}>{t('orderPlaced')}</h1>
        <p style={styles.welcomeSub}>{t('yourOrderNumberIs')}</p>
        <div style={styles.orderNumber}>#{orderId}</div>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 24, fontSize: 18 }}>
          {t('thankYouMessage'
          )}
        </p>
        <button onClick={onDone} style={{ ...styles.addBtn, marginTop: 32, padding: '14px 40px', fontSize: 16 }}>
          {t('newOrder')}
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

// ── Styles ────────────────────────────────────────────────────────────────────

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