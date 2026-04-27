'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/useTranslation";
import { Lang } from "@/lib/translations";
import { useRef } from 'react';

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

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
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

const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%', '125%'];
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

  type QuizFlavor = 'sweet' | 'fruity' | 'strong' | 'coffee' | 'unsure';
  type QuizSweetness = 'low' | 'medium' | 'high';
  type QuizToppings = 'yes' | 'no';

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);

  const [quizFlavor, setQuizFlavor] = useState<QuizFlavor | null>(null);
  const [quizSweetness, setQuizSweetness] = useState<QuizSweetness | null>(null);
  const [quizToppings, setQuizToppings] = useState<QuizToppings | null>(null);

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

  const [waitTime, setWaitTime]                     = useState<number | null>(null);
  const [availableToppings, setAvailableToppings]   = useState<string[]>([]);
  const [translatedToppings, setTranslatedToppings] = useState<string[]>([]);
  const [translatedCategories, setTranslatedCategories] = useState<string[]>(
    CATEGORIES.map(c => c.label)
  );
  const [translating, setTranslating] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const [showA11y, setShowA11y] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionMatch, setNutritionMatch] = useState('');
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [weather, setWeather] = useState<{
    temp: number;
    weathercode: number;
  } | null>(null);

  // Fetch menu
  useEffect(() => {
    if (view === 'menu' && menu.length === 0) {
      fetch('/api/menu').then(r => r.json()).then(setMenu);
    }
  }, [view, menu.length]);

  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(setWeather);
  }, []);

  useEffect(() => {
    if (!screenReader || !weather) return;

    speakIfEnabled(
      `Weather updated. ${weather.temp} degrees Fahrenheit. ${getWeatherLabel(weather.weathercode)}`
    );
  }, [weather, screenReader]);

  useEffect(() => {
    if (!screenReader || !customizing || !nutrition) return;

    speakIfEnabled(
      `Nutrition facts updated. Calories ${nutrition.calories}. Protein ${nutrition.protein} grams. Sugar ${nutrition.sugar} grams.`
    );
  }, [nutrition, screenReader, customizing]);

  useEffect(() => {
    if (!screenReader || !showQuiz) return;

    speakQuizStep(quizStep);
  }, [quizStep, showQuiz, screenReader]);

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

  const subtotal = cart.reduce((s, i) => s + i.price, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  useEffect(() => {
    if (!screenReader || !customizing) return;

    window.speechSynthesis.cancel();

    const sizeLabel = SIZE_LABELS[selSize] ?? selSize;

    speakIfEnabled(
      `Customization panel opened for ${customizing.name}. No toppings selected.`
    );
  }, [customizing, screenReader]);

  useEffect(() => {
    if (!screenReader || !customizing) return;

    speakIfEnabled(
      "First choose size. Then sugar level. Then ice level. Finally toppings."
    );
  }, [customizing, screenReader]);

  useEffect(() => {
    if (customizing && modalRef.current) {
      modalRef.current.focus();
    }
  }, [customizing]);

  useEffect(() => {
    if (!screenReader || !customizing) return;
    speakIfEnabled(`Size selected: ${SIZE_LABELS[selSize]}`);
  }, [selSize]);

  useEffect(() => {
    if (!screenReader || !customizing) return;
    speakIfEnabled(`Sugar level: ${selSugar}`);
  }, [selSugar]);

  useEffect(() => {
    if (!screenReader || !customizing) return;
    speakIfEnabled(`Ice level: ${t(selIce as any)}`);
  }, [selIce]);

  const isFirstRender= useRef(true);

  useEffect(() => {
    if (!screenReader || !customizing) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (selToppings.length === 0) {
      speakIfEnabled("No toppings selected");
    } else {
      speakIfEnabled(`Toppings selected: ${selToppings.join(", ")}`);
    }
  }, [selToppings]);

  useEffect(() => {
    if (customizing) {
      isFirstRender.current = true;
    }
  }, [customizing]);

  useEffect(() => {
    async function fetchNutrition() {
      if (!customizing) {
        setNutrition(null);
        setNutritionMatch('');
        return;
      }

      const sizeLabel = SIZE_LABELS[selSize] ?? 'Medium';

      try {
        setNutritionLoading(true);

        const params = new URLSearchParams({
          query: customizing.name,
          size: sizeLabel
        });

        const res = await fetch(`/api/nutrition?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.found) {
          setNutrition(null);
          setNutritionMatch('');
          return;
        }

        // keep raw nutrition data
        setNutrition(data.nutrition);

        // translate ONLY if needed
        if (data.matchedFood) {
          if (lang === 'en') {
            setNutritionMatch(data.matchedFood);
          } else {
            const translateRes = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                texts: [data.matchedFood],
                target: lang
              }),
            });

            const translateData = await translateRes.json();
            setNutritionMatch(translateData.translatedTexts[0]);
          }
        } else {
          setNutritionMatch('');
        }

      } catch {
        setNutrition(null);
        setNutritionMatch('');
      } finally {
        setNutritionLoading(false);
      }
    }

    fetchNutrition();
  }, [customizing, selSize, lang]); // ADD lang here

  useEffect(() => {
    if (view !== 'confirm' || !screenReader) return;

    window.speechSynthesis.cancel();

    speakIfEnabled(
      `Confirm order screen. You have ${cart.length} items. Total is ${total.toFixed(
        2
      )} dollars. Review your order or go back to edit.`
    );
  }, [view, screenReader, cart.length, total]);

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


  function getWeatherLabel(code: number) {
    if (code === 0) return t('weatherClear'); //Clear ☀️
    if (code <= 3) return t('weatherCloudy'); //Cloudy ☁️
    if (code <= 48) return t('weatherFoggy'); //Foggy 🌫️
    if (code <= 67) return t('weatherRain'); //Rain 🌧️
    if (code <= 77) return t('weatherSnow'); //Snow ❄️
    if (code >= 95) return t('weatherOtherCloudy'); //Cloudy 🌥️"
    if (code >= 95 && code <= 99) return t('weatherStorm'); //Storm ⛈️

    // fallback
    return t('weatherMild'); //"Mild 🌤️"
  }

  function itemPrice(base: number, size: string, toppings: string[]) {
    const sizeMod    = SIZES.find(s => s.key === size)?.modifier ?? 0;
    const toppingMod = toppings.length * TOPPING_PRICE;
    return base + sizeMod + toppingMod;
  }

  function openCustomize(item: MenuItem, quizDefaults?: {
    sugar?: string;
    toppings?: string[];
  }) {
    setCustomizing(item);
    setSelSize(SIZES[1].key);
    setSelSugar(quizDefaults?.sugar ?? '75%');
    setSelIce(ICE_LEVELS[2].key);
    setSelToppings(quizDefaults?.toppings ?? []);
  }

  function openQuiz() {
    setQuizStep(0);
    setQuizFlavor(null);
    setQuizSweetness(null);
    setQuizToppings(null);
    setShowQuiz(true);
  }

  function speakQuizStep(step: number) {
    window.speechSynthesis.cancel();

    if (step === 0) {
      speakIfEnabled(
        `Question 1. What kind of flavor do you prefer? Sweet, fruity, strong tea, coffee, or unsure.`
      );
    }

    if (step === 1) {
      speakIfEnabled(
        `Question 2. What sweetness level do you want? Low, medium, or high.`
      );
    }

    if (step === 2) {
      speakIfEnabled(
        `Question 3. Do you want toppings? Yes or no.`
      );
    }
  }

  function speakIfEnabled(text: string) {
    if (!screenReader) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
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

  function scale(size: number) {
    return size * textScale;
  }

  function recommendDrink(): MenuItem | null {
    if (!menu.length) return null;

    const lower = (name: string) => name.toLowerCase();

    // FRUITY
    if (quizFlavor === 'fruity') {
      return (
        menu.find(m =>
          lower(m.name).includes('mango') ||
          lower(m.name).includes('strawberry') ||
          lower(m.name).includes('passion')
        ) || menu[0]
      );
    }

    function QuizButton({ label, onClick }: any) {
      return (
        <button
          onClick={onClick}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid #ddd6fe',
            background: '#f9f7ff',
            color: '#4c1d95',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#ede9fe')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#f9f7ff')}
        >
          {label}
        </button>
      );
    }

    function QuizCard({ title, children }: any) {
      return (
        <div style={{ marginTop: 12 }}>
          <p style={{
            fontWeight: 600,
            marginBottom: 10,
            color: '#374151'
          }}>
            {title}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {children}
          </div>
        </div>
      );
    }

    // STRONG TEA
    if (quizFlavor === 'strong') {
      return (
        menu.find(m =>
          lower(m.name).includes('matcha') ||
          lower(m.name).includes('oolong') ||
          lower(m.name).includes('earl grey') ||
          lower(m.name).includes('black tea')
        ) || menu[0]
      );
    }

    // SWEET
    if (quizFlavor === 'sweet') {
      return (
        menu.find(m =>
          lower(m.name).includes('brown sugar') ||
          lower(m.name).includes('caramel') ||
          lower(m.name).includes('taro')
        ) || menu[0]
      );
    }

    // COFFEE-LIKE
    if (quizFlavor === 'coffee') {
      return (
        menu.find(m =>
          lower(m.name).includes('coffee')
        ) || menu[0]
      );
    }

    // fallback
    return menu[Math.floor(Math.random() * menu.length)];
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

      // Fetch estimated wait time
      try {
        const waitRes = await fetch(`/api/wait-time?orderid=${encodeURIComponent(data.orderId)}`);
        if (waitRes.ok) {
          const waitData = await waitRes.json();
          setWaitTime(waitData.estimatedMinutes);
        }
      } catch (err) {
        console.error('Could not fetch wait time:', err);
        setWaitTime(null);
      }

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
        textScale={textScale}
        waitTime={waitTime}
        onDone={() => {
          setView('welcome');
          setOrderId(null);
          setFinalOrder([]);
          setWaitTime(null);
        }}
      />
    );
  }

  // ── Menu + Cart ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.shell}>
      <div style={styles.menuArea}>
        <div style={styles.menuHeader}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ ...styles.logo, fontSize: scale(28) }}>
              🧋 Boba Shop
            </span>

            {weather && (
              <span style={{ fontSize: scale(18), color: '#6b7280' }}>
                {weather.temp}°F • {getWeatherLabel(weather.weathercode)}
              </span>
            )}

            <span style={{ ...styles.headerSub, fontSize: scale(15) }}>
              {t('customize')}
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => {
                setShowA11y(prev => {
                  const next = !prev;

                  if (screenReader) {
                    speakIfEnabled(
                      `Accessibility menu ${next ? "opened" : "closed"}`
                    );
                  }

                  return next;
                });
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #ddd6fe',
                background: showA11y ? '#7c3aed' : '#f3f0ff',
                color: showA11y ? '#fff' : '#4c1d95',
                cursor: 'pointer',
                fontSize: scale(14),
                fontWeight: 600,
              }}
            >
              Accessibility
            </button>

            <select
              value={lang}
              onChange={e => {
                const newLang = e.target.value as Lang;
                setLang(newLang);

                if (screenReader) {
                  speakIfEnabled(`Language changed to ${newLang}`);
                }
              }}
              style={{ marginLeft: 'auto', padding: '6px', borderRadius: 8, border: '1px solid #ddd6fe', fontSize: scale(14) }}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="zh">中文</option>
              <option value="ko">한국어</option>
            </select>
          </div>
        </div>

        {showA11y && (
          <div style={{
            background: '#f9fafb',
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>

            {/* TEXT SIZE */}
            <div>
              <label style={{ fontSize: scale(14), display: 'block', marginBottom: 6 }}>
                Text Size
              </label>

              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={textScale}
                onChange={(e) => setTextScale(Number(e.target.value))}
              />
            </div>

            {/* SCREEN READER */}
            <button
              onClick={() => {
                setScreenReader(prev => {
                  const next = !prev;

                  if (next) {
                    window.speechSynthesis.cancel();
                    const msg = new SpeechSynthesisUtterance("Screen reader enabled");
                    window.speechSynthesis.speak(msg);
                  } else {
                    window.speechSynthesis.cancel();
                  }

                  return next;
                });
              }}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #ddd6fe',
                background: screenReader ? '#7c3aed' : '#f3f0ff',
                color: screenReader ? '#fff' : '#4c1d95',
                cursor: 'pointer',
                fontSize: scale(14),
                fontWeight: 600,
              }}
            >
              Screen Reader: {screenReader ? "ON" : "OFF"}
            </button>

          </div>
        )}

        <button
          onClick={() => {
            openQuiz();
            speakIfEnabled(`Help me choose quiz opened`);
          }}
          onFocus={() => speakIfEnabled(`Help me choose. Opens drink recommendation quiz.`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              speakIfEnabled(`Help me choose quiz opened`);
            }
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid #ddd6fe',
            background: '#f3f0ff',
            color: '#4c1d95',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          🎯 {t('quizHelpButton')}
        </button>

        {/* Category tabs */}
        <div style={styles.tabs}>
          {CATEGORIES.map((cat, i) => {
            const label = translatedCategories[i] ?? cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(label)}
                tabIndex={0}
                onFocus={() => speakIfEnabled(`Category ${label}`)}
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
            <button key={item.name} onClick={() => openCustomize(item)} style={styles.itemCard} onFocus={()=> speakIfEnabled(`${item.name}. Price from ${item.price} dollars. Press to customize.`)} tabIndex={0}>
              <span style={{...styles.itemName, fontSize: scale(15)}}>{item.name}</span>
              <span style={{...styles.itemPrice, fontSize: scale(14)}}>from ${item.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div style={styles.cartPanel}>
        <h2 style={{...styles.cartTitle, fontSize: scale(22)}}>{t('yourOrder')}</h2>

        {cart.length === 0 ? (
          <p style={styles.cartEmpty}>{t('noItems')}</p>
        ) : (
          <div style={styles.cartList}>
            {cart.map((item, i) => (
              <div key={i} style={styles.cartItem} tabIndex={0} onFocus={() => speakIfEnabled(`${item.name}, size ${item.size}, ${item.sugar} sugar, ${item.ice}, price ${item.price} dollars`)}>
                <div style={{ flex: 1 }}>
                  <div style={{...styles.cartItemName, fontSize: scale(14)}}>{item.name}</div>
                  <div style={{...styles.cartItemMeta, fontSize: scale(12)}}>
                    {t(item.size as any)} · {t(item.sugar as any)} {t('sugar')}· {t(item.ice as any)}
                    {item.toppings.length > 0 && <> · {item.toppings.map(translateTopping).join(', ')}</>}
                  </div>
                </div>
                <div style={styles.cartItemRight}>
                  <span style={styles.cartItemPrice}>${item.price.toFixed(2)}</span>
                  <button onClick={() => removeFromCart(i)} style={styles.removeBtn} tabIndex={0} onFocus={() => speakIfEnabled(`Remove ${item.name} from cart`)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.totals}>
          <div style={{...styles.totalRow, fontSize: scale(15)}}><span>{t('subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>
          <div style={styles.totalRow}><span>{t('tax')}</span><span>${tax.toFixed(2)}</span></div>
          <div style={{ ...styles.totalRow, ...styles.totalBold }}>
            <span>{t('total')}</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => cart.length > 0 && setView('confirm')}
          onFocus={() => speakIfEnabled(`Review order button. Press to continue to checkout.`)}
          disabled={cart.length === 0}
          style={{ ...styles.checkoutBtn, fontSize: scale(17), opacity: cart.length === 0 ? 0.4 : 1 }}
        >
          {t('review')}
        </button>
      </div>

      {/* Customize Modal */}
      {customizing && (
        <div style={styles.overlay} onClick={() => setCustomizing(null)}>
          <div
            ref={modalRef}
            tabIndex={-1}
            style={styles.modal}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{...styles.modalTitle, fontSize: scale(24)}}>{customizing.name}</h2>
            <p style={{...styles.modalBase, fontSize: scale(14)}}>{t("basePrice")}: ${customizing.price.toFixed(2)}</p>
            <div style={styles.nutritionCard}>
              <div style={{ ...styles.nutritionTitle, fontSize: scale(14) }}>
                {t('nutritionFacts')} ({t(selSize as any)})
              </div>

              {nutritionLoading ? (
                <div style={{ ...styles.nutritionText, fontSize: scale(13) }}>
                  {t('loadingNutrition')}
                </div>
              ) : nutrition ? (
                <div style={{ ...styles.nutritionGrid, fontSize: scale(13) }}>
                  <span>{t('calories')}: {nutrition.calories}</span>
                  <span>{t('protein')}: {nutrition.protein} g</span>
                  <span>{t('carbs')}: {nutrition.carbs} g</span>
                  <span>{t('fat')}: {nutrition.fat} g</span>
                  <span>{t('sugar')}: {nutrition.sugar} g</span>
                  <span>{t('fiber')}: {nutrition.fiber} g</span>
                  <span>{t('sodium')}: {nutrition.sodium} mg</span>

                  {nutritionMatch ? (
                    <span>{t('usdaMatch')}: {nutritionMatch}</span>
                  ) : null}
                </div>
              ) : (
                <div style={{ ...styles.nutritionText, fontSize: scale(13) }}>
                  {t('nutritionUnavailable')}
                </div>
              )}
            </div>

            <OptionGroup label={t("size")} scale ={scale}>
              {SIZES.map(s => (
                <Chip
                  key={s.key}
                  label={t(s.key as any)}
                  selected={selSize === s.key}
                  onClick={() => setSelSize(s.key)}
                  scale={scale}
                  tabIndex={0}
                  onFocus={() => speakIfEnabled(`Size ${t(s.key as any)}`)}
                />
              ))}
            </OptionGroup>

            <OptionGroup label={t('sugar')} scale={scale}>
              {SUGAR_LEVELS.map(s => (
                <Chip 
                  key={s} 
                  label={s} 
                  selected={selSugar === s} 
                  onClick={() => setSelSugar(s)} 
                  scale={scale} 
                  tabIndex={0} 
                  onFocus={() => speakIfEnabled(`Sugar level ${s}`)} 
                />
              ))}
            </OptionGroup>

            <OptionGroup label={t("ice")} scale={scale}>
              {ICE_LEVELS.map(i => (
                <Chip
                  key={i.key}
                  label={t(i.key as any)}
                  selected={selIce === i.key}
                  onClick={() => setSelIce(i.key)}
                  scale={scale}
                  tabIndex={0}
                  onFocus={() => speakIfEnabled(`Ice Label ${t(i.key as any)}`)}
                />
              ))}
            </OptionGroup>

            <OptionGroup label={t('toppings')} scale={scale}>
              {(translatedToppings.length ? translatedToppings : availableToppings).map((top, i) => (
                <Chip
                  key={availableToppings[i] ?? top}
                  label={`${top} +$${TOPPING_PRICE.toFixed(2)}`}
                  selected={selToppings.includes(top)}
                  onClick={() => toggleTopping(top)}
                  scale={scale}
                  multi
                  tabIndex={0}
                  onFocus={() => speakIfEnabled(`Topping ${top}`)}
                />
              ))}
            </OptionGroup>

            <div style={styles.modalFooter}>
              <span style={{...styles.modalTotal, fontSize: scale(22)}}>
                ${itemPrice(customizing.price, selSize, selToppings).toFixed(2)}
              </span>
              <button onClick={() => setCustomizing(null)} tabIndex={0} onFocus={() => speakIfEnabled(`Cancel. Close customizaiton without adding item.`)} style={{...styles.cancelBtn, fontSize: scale(15)}}>{t('cancel')}</button>
              <button onClick={confirmCustomize} tabIndex={0} onFocus={() => speakIfEnabled(`Add to order. confirm and add this drink to your cart.`)} style={{...styles.addBtn, fontSize: scale(15)}}>{t('addToOrder')}</button>
            </div>
          </div>
        </div>
      )}

      {showQuiz && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{t('quizTitle')}</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              {quizStep === 0 && (
                <>
                  <p>{t('quizFlavorQuestion')}</p>

                  {[
                    ['sweet', t('quizSweet')],
                    ['fruity', t('quizFruity')],
                    ['strong', t('quizStrong')],
                    ['coffee', t('quizCoffee')],
                    ['unsure', t('quizUnsure')],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setQuizFlavor(key as QuizFlavor);
                        setQuizStep(1);
                      }}
                      onFocus={() => speakIfEnabled(label)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          speakIfEnabled(label);
                        }
                      }}
                      style={styles.addBtn}
                    >
                      {label}
                    </button>
                  ))}
                </>
              )}

              {quizStep === 1 && (
                <>
                  <p>Sweetness level?</p>

                  {[
                    ['low', t('quizLow')],
                    ['medium', t('quizMedium')],
                    ['high', t('quizHigh')],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setQuizSweetness(key as QuizSweetness);
                        setQuizStep(2);
                      }}
                      onFocus={() => speakIfEnabled(String(label))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          speakIfEnabled(String(label));
                        }
                      }}
                      style={styles.addBtn}
                    >
                      {label}
                    </button>
                  ))}
                </>
              )}

              {quizStep === 2 && (
                <>
                  <p>Do you want toppings?</p>

                  {[
                    ['yes', t('quizYes')],
                    ['no', t('quizNo')],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setQuizToppings(key as QuizToppings);

                        const rec = recommendDrink();

                        if (rec) {
                          const sugarMap = {
                            low: '25%',
                            medium: '50%',
                            high: '100%',
                          };

                          openCustomize(rec, {
                            sugar: sugarMap[quizSweetness!],
                            toppings: key === 'yes' ? ['tapiocaPearls'] : []
                          });
                        }

                        setShowQuiz(false);
                      }}
                      onFocus={() => speakIfEnabled(String(label))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          speakIfEnabled(String(label));
                        }
                      }}
                      style={styles.addBtn}
                    >
                      {label}
                    </button>
                  ))}
                </>
              )}
            </div>
            <button
              onClick={() => setShowQuiz(false)}
              style={styles.cancelBtn}
            >
              {t('quizCancel')}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {view === 'confirm' && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 480 }}>
            <h2 style={{...styles.modalTitle, fontSize: scale(24)}}>{t('confirmOrder')}</h2>
            <div style={{ marginBottom: 20 }}>
              {cart.map((item, i) => (
                <div key={i} style={{...styles.confirmRow, fontSize: scale(15)}} tabIndex={0} onFocus={() => speakIfEnabled(`${translateDrinkName(item.name)} ${t(item.size as any)}, price ${item.price} dollars`)}>
                  <span>
                    {translateDrinkName(item.name)} ({t(item.size as any)})
                  </span>

                  <span>
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ ...styles.totalRow, ...styles.totalBold, marginBottom: 28, fontSize: scale(18) }}>
              <span>{t('total')}</span><span>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setView('menu')} tabIndex={0} onFocus={() => speakIfEnabled(`Back. Return to menu to edit your order.`)} style={{...styles.cancelBtn, fontSize: scale(15)}}>← Back</button>
              <button onClick={placeOrder} tabIndex={0} onFocus={() => speakIfEnabled(`Place order button. Finalize your purchase and submit your order.`)} style={{ ...styles.addBtn, flex: 1, fontSize: scale(15) }}>{t('placeOrder')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReceiptScreen({orderId, items, onDone, lang, textScale, waitTime}: {orderId: number; items: CustomizedItem[]; onDone: () => void; lang: Lang; textScale: number; waitTime: number | null}) {
  const { t } = useTranslation(lang);
  function scale(size: number) {
    return size * textScale;
  }
  useEffect(() => {
    const timer = setTimeout(onDone, 8000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div style={styles.welcome}>
      <div style={styles.welcomeInner}>
        <div style={styles.welcomeEmoji}>✅</div>
        <h1 style={{...styles.welcomeTitle, fontSize: scale(30)}}>{t('orderPlaced')}</h1>
        <p style={{...styles.welcomeSub, fontSize: scale(15)}}>{t('yourOrderNumberIs')}</p>
        <div style={{...styles.orderNumber, fontSize: scale(50)}}>#{orderId}</div>

        {waitTime !== null && (
          <div style={{
            marginTop: 5,
            padding: '15px 20px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 15,
            border: '2px solid rgba(255,255,255,0.25)',
            display: 'inline-block',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: scale(16), margin: '0 0 6px 0' }}>
              {t('estimatedWaitTime')}
            </p>
            <p style={{ color: '#fde68a', fontSize: scale(36), fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
              ~{waitTime} min{waitTime !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 20, fontSize: scale(18) }}>
          {t('thankYouMessage'
          )}
        </p>
        <button onClick={onDone} style={{ ...styles.addBtn, marginTop: 20, padding: '14px 40px', fontSize: scale(16) }}>
          {t('newOrder')}
        </button>
      </div>
    </div>
  );
}

function OptionGroup({ label, children, scale }: { label: string; children: React.ReactNode; scale: (n: number) => number; }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{...styles.optionLabel, fontSize: scale(13)}}>{label}</div>
      <div style={styles.optionRow}>{children}</div>
    </div>
  );
}

function Chip({ label, selected, onClick, multi = false, scale, tabIndex, onFocus, onKeyDown, }: {
  label: string; selected: boolean; onClick: () => void; multi?: boolean; scale: (n: number) => number; tabIndex?: number; onFocus?: () => void; onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}) {
  return (
    <button onClick={onClick} tabIndex={tabIndex} onFocus={onFocus} onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); onClick();}}} style={{
      ...styles.chip,
      fontSize: scale(14),
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
  nutritionCard: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 12,
    padding: '10px 12px',
    marginBottom: 18,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#065f46',
    marginBottom: 6,
  },
  nutritionText: {
    fontSize: 13,
    color: '#047857',
  },
  nutritionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 4,
    fontSize: 13,
    color: '#065f46',
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
