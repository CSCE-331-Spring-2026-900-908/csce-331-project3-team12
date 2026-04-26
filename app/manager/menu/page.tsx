'use client';

import { useState, useEffect } from 'react';

const PURPLE    = '#7B3FF2';
const PURPLE_XL = '#EDE9FE';
const BORDER    = '#E5E7EB';
const GRAY      = '#6B7280';
const TEXT      = '#1F2933';

const CATEGORIES = ['Milk Tea', 'Fruit Tea', 'Matcha', 'Slush', 'Seasonal'];

interface Drink {
  id:       number;
  name:     string;
  price:    number;
  category: string;
}

interface Ingredient {
  ingredientId:  number;
  name:          string;
  type:          string;
  selected:      boolean;
  unitsPerDrink: number;
}

export default function MenuManagementPage() {
  const [drinks, setDrinks]         = useState<Drink[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId]   = useState<number | null>(null);

  const [nameField,     setNameField]     = useState('');
  const [priceField,    setPriceField]    = useState('');
  const [categoryField, setCategoryField] = useState(CATEGORIES[0]);

  const [showIngredients,     setShowIngredients]     = useState(false);
  const [ingredients,         setIngredients]         = useState<Ingredient[]>([]);
  const [ingredientsLoading,  setIngredientsLoading]  = useState(false);
  const [ingredientsFilter,   setIngredientsFilter]   = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const res  = await fetch('/manager/api/menu');
      const json = await res.json();
      if (res.ok) setDrinks(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function selectDrink(drink: Drink) {
    if (selectedId === drink.id) {
      setSelectedId(null);
      setNameField(''); setPriceField(''); setCategoryField(CATEGORIES[0]);
    } else {
      setSelectedId(drink.id);
      setNameField(drink.name);
      setPriceField(drink.price.toFixed(2));
      setCategoryField(CATEGORIES.includes(drink.category) ? drink.category : CATEGORIES[0]);
    }
  }

  async function handleAdd() {
    if (!nameField || !priceField) { alert('Please fill in name and price.'); return; }
    if (isNaN(parseFloat(priceField))) { alert('Price must be a number.'); return; }
    const res  = await fetch('/manager/api/menu', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: nameField, price: priceField, category: categoryField }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    setNameField(''); setPriceField(''); setCategoryField(CATEGORIES[0]);
    refresh();
  }

  async function handleUpdate() {
    if (!selectedId) { alert('Select a row first.'); return; }
    if (!nameField || !priceField) { alert('Please fill in name and price.'); return; }
    if (isNaN(parseFloat(priceField))) { alert('Price must be a number.'); return; }
    const res  = await fetch('/manager/api/menu', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: selectedId, name: nameField, price: priceField, category: categoryField }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    refresh();
  }

  async function handleDelete() {
    if (!selectedId) { alert('Select a row first.'); return; }
    if (!confirm('Delete this menu item? This cannot be undone.')) return;
    const res  = await fetch('/manager/api/menu', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: selectedId }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    setSelectedId(null);
    setNameField(''); setPriceField(''); setCategoryField(CATEGORIES[0]);
    refresh();
  }

  async function handleEditIngredients() {
    if (!selectedId) { alert('Select a drink first.'); return; }
    setShowIngredients(true);
    setIngredientsLoading(true);
    setIngredientsFilter('');
    try {
      const res  = await fetch(`/manager/api/menu/ingredients?drinkId=${selectedId}`);
      const json = await res.json();
      if (res.ok) setIngredients(json);
    } finally {
      setIngredientsLoading(false);
    }
  }

  async function saveIngredients() {
    const selected = ingredients.filter(i => i.selected && i.unitsPerDrink > 0);
    const res = await fetch('/manager/api/menu/ingredients', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        drinkId:     selectedId,
        ingredients: selected.map(i => ({ ingredientId: i.ingredientId, unitsPerDrink: i.unitsPerDrink })),
      }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    setShowIngredients(false);
  }

  function toggleIngredient(idx: number, checked: boolean) {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], selected: checked };
    setIngredients(updated);
  }

  function setUnits(idx: number, val: number) {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], unitsPerDrink: Math.max(1, val) };
    setIngredients(updated);
  }

  const filteredIngredients = ingredientsFilter
    ? ingredients.filter(i =>
        i.name.toLowerCase().includes(ingredientsFilter.toLowerCase()) ||
        i.type.toLowerCase().includes(ingredientsFilter.toLowerCase())
      )
    : ingredients;

  const selectedDrinkName = drinks.find(d => d.id === selectedId)?.name ?? '';

  const btn = (color = '#555'): React.CSSProperties => ({
    background: color, color: '#fff', border: 'none',
    borderRadius: 6, padding: '7px 16px', fontSize: 13,
    fontWeight: 'bold', cursor: 'pointer',
  });

  const inputStyle = (width: number): React.CSSProperties => ({
    border: `1px solid ${BORDER}`, borderRadius: 6,
    padding: '6px 10px', fontSize: 14, width,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3FF', fontFamily: 'sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background: PURPLE, padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: '0.3px' }}>
          Menu Management
        </h1>
        <button
          onClick={() => (window.location.href = '/manager')}
          style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
            padding: '6px 16px', fontSize: 14, cursor: 'pointer',
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ padding: '28px 40px 40px' }}>

        {/* Drinks table card */}
        <div style={{ background: PURPLE_XL, borderRadius: 10, padding: 24, marginBottom: 0 }}>
          <h2 style={{ textAlign: 'center', margin: '0 0 14px', fontSize: 20, fontWeight: 'bold', color: TEXT }}>
            Drinks Menu
          </h2>

          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 480, marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 14, borderRadius: 8, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#F3F0FF', borderBottom: `2px solid ${PURPLE_XL}` }}>
                  {['Name', 'Price', 'Category'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, fontSize: 13, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan={3} style={{ padding: 14, color: GRAY }}>Loading...</td></tr>
                  : drinks.map(drink => (
                    <tr
                      key={drink.id}
                      onClick={() => selectDrink(drink)}
                      onMouseEnter={() => setHoveredId(drink.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        borderBottom: `1px solid ${BORDER}`,
                        background: selectedId === drink.id ? '#DBEAFE' : hoveredId === drink.id ? '#F5F3FF' : '#fff',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                    >
                      <td style={{ padding: '9px 12px', fontWeight: selectedId === drink.id ? 600 : 400 }}>{drink.name}</td>
                      <td style={{ padding: '9px 12px', color: PURPLE, fontWeight: 600 }}>${drink.price.toFixed(2)}</td>
                      <td style={{ padding: '9px 12px', color: GRAY }}>{drink.category}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Editor row */}
          <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
                <input style={inputStyle(160)} value={nameField} onChange={e => setNameField(e.target.value)} placeholder="e.g. Taro Milk Tea" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price ($)</label>
                <input style={inputStyle(80)} value={priceField} onChange={e => setPriceField(e.target.value)} placeholder="5.99" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                <select
                  value={categoryField}
                  onChange={e => setCategoryField(e.target.value)}
                  style={{ ...inputStyle(130), background: '#fff' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={handleAdd}    disabled={loading} style={{ ...btn(), opacity: loading ? 0.5 : 1 }}>Add Item</button>
              <button onClick={handleUpdate} disabled={loading || !selectedId} style={{ ...btn(), opacity: (loading || !selectedId) ? 0.5 : 1 }}>Update Selected</button>
              <button onClick={handleDelete} disabled={loading || !selectedId} style={{ ...btn('#c0392b'), opacity: (loading || !selectedId) ? 0.5 : 1 }}>Delete</button>
              <button onClick={handleEditIngredients} disabled={loading || !selectedId} style={{ ...btn(PURPLE), opacity: (loading || !selectedId) ? 0.5 : 1, marginLeft: 'auto' }}>
                Edit Ingredients →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients Modal */}
      {showIngredients && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16,
            padding: '28px 28px 20px',
            width: 680, maxHeight: '82vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 40px rgba(123,63,242,0.18)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT }}>Edit Ingredients</h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: GRAY }}>{selectedDrinkName}</p>
              </div>
              <button
                onClick={() => setShowIngredients(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: GRAY, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Search filter */}
            <input
              value={ingredientsFilter}
              onChange={e => setIngredientsFilter(e.target.value)}
              placeholder="Search ingredients…"
              style={{ ...inputStyle(240), marginBottom: 12, width: '100%', boxSizing: 'border-box' }}
            />

            {/* Table */}
            {ingredientsLoading
              ? <p style={{ color: GRAY, textAlign: 'center', padding: 20 }}>Loading ingredients...</p>
              : (
                <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ background: '#F3F0FF', borderBottom: `2px solid ${PURPLE_XL}` }}>
                        {['Use', 'Ingredient', 'Category', 'Units / Drink'].map(col => (
                          <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ing, i) => {
                        const realIdx = ingredients.indexOf(ing);
                        return (
                          <tr
                            key={ing.ingredientId}
                            style={{
                              borderBottom: `1px solid ${BORDER}`,
                              background: ing.selected ? '#F0EBFF' : '#fff',
                              transition: 'background 0.1s',
                            }}
                          >
                            <td style={{ padding: '7px 12px' }}>
                              <input
                                type="checkbox"
                                checked={ing.selected}
                                onChange={e => toggleIngredient(realIdx, e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: PURPLE, cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '7px 12px', fontWeight: ing.selected ? 600 : 400 }}>{ing.name}</td>
                            <td style={{ padding: '7px 12px', color: GRAY, fontSize: 13 }}>{ing.type}</td>
                            <td style={{ padding: '7px 12px' }}>
                              <input
                                type="number"
                                min={1}
                                value={ing.unitsPerDrink}
                                disabled={!ing.selected}
                                onChange={e => setUnits(realIdx, parseInt(e.target.value) || 1)}
                                style={{
                                  width: 56, border: `1px solid ${BORDER}`, borderRadius: 4,
                                  padding: '3px 6px', fontSize: 13,
                                  opacity: ing.selected ? 1 : 0.35,
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }

            {/* Modal footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 13, color: GRAY }}>
                {ingredients.filter(i => i.selected).length} ingredient{ingredients.filter(i => i.selected).length !== 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowIngredients(false)} style={{ ...btn('#888') }}>Cancel</button>
                <button onClick={saveIngredients} style={{ ...btn(PURPLE) }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
