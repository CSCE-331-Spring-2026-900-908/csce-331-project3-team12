'use client';

import { useState, useEffect } from 'react';

const ACCENT = '#EDE9FE';
const BORDER = '#E5E7EB';
const GRAY   = '#6B7280';

type Mode   = 'current' | 'low';
type Status = 'OK' | 'Low' | 'Critical';

interface Item {
  name:          string;
  category:      string;
  stock:         number;
  lowStockLevel: number;
  status:        Status;
}

function computeStatus(stock: number, lowStockLevel: number): Status {
  if (stock <= 0)             return 'Critical';
  if (stock <= lowStockLevel) return 'Low';
  return 'OK';
}

export default function InventoryView() {
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [mode, setMode]           = useState<Mode>('current');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [hoveredName, setHoveredName]   = useState<string | null>(null);
  const [nameField, setNameField] = useState('');
  const [typeField, setTypeField] = useState('');
  const [qtyField,  setQtyField]  = useState('');

  async function refresh() {
    setLoading(true);
    setFetchError('');
    try {
      const res  = await fetch('/manager/api/inventory');
      const text = await res.text();
      if (!text) { setFetchError('Server returned an empty response.'); setLoading(false); return; }
      const json = JSON.parse(text);
      if (res.ok) {
        setInventory(json.map((r: Omit<Item, 'status'>) => ({
          ...r,
          status: computeStatus(r.stock, r.lowStockLevel),
        })));
      } else {
        setFetchError(json.error ?? 'Failed to load inventory.');
      }
    } catch (e) {
      setFetchError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const displayed = mode === 'low'
    ? inventory.filter(i => i.status === 'Low' || i.status === 'Critical')
    : inventory;

  function selectItem(item: Item) {
    if (selectedName === item.name) {
      setSelectedName(null);
      setNameField(''); setTypeField(''); setQtyField('');
    } else {
      setSelectedName(item.name);
      setNameField(item.name);
      setTypeField(item.category);
      setQtyField(String(item.stock));
    }
  }

  async function addItem() {
    if (!nameField || !typeField || !qtyField) { alert('Please fill in all fields.'); return; }
    if (isNaN(parseInt(qtyField))) { alert('Quantity must be a number.'); return; }
    const res  = await fetch('/manager/api/inventory', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: nameField, category: typeField, quantity: qtyField }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    refresh();
  }

  async function updateItem() {
    if (!selectedName) { alert('Select a row in the table to update.'); return; }
    if (!qtyField)     { alert('Enter a new quantity.'); return; }
    if (isNaN(parseInt(qtyField))) { alert('Quantity must be a number.'); return; }
    const res  = await fetch('/manager/api/inventory', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: selectedName, category: typeField, quantity: qtyField }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    refresh();
  }

  async function deleteItem() {
    if (!selectedName) { alert('Select a row first.'); return; }
    if (!confirm('Are you sure you want to delete this item?')) return;
    const res  = await fetch('/manager/api/inventory', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: selectedName }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    setSelectedName(null);
    setNameField(''); setTypeField(''); setQtyField('');
    refresh();
  }

  const modePill = (active: boolean): React.CSSProperties => ({
    background: active ? '#fff' : ACCENT,
    border: 'none',
    borderRadius: 16,
    fontWeight: 'bold',
    fontSize: 14,
    color: active ? '#000' : '#333',
    cursor: 'pointer',
    padding: '0 24px',
    height: '100%',
  });

  const input = (width: number): React.CSSProperties => ({
    border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: 14, width,
  });

  const btn: React.CSSProperties = {
    background: '#555', color: '#fff', border: 'none',
    borderRadius: 4, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
  };

  return (
    <div>
      {fetchError && <div style={{ color: 'red', marginBottom: 12 }}>{fetchError}</div>}
      {/* Mode Pills */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          background: '#F0F0F0',
          borderRadius: 16,
          padding: 4,
          width: 380,
          height: 48,
        }}>
          <button style={modePill(mode === 'current')} onClick={() => setMode('current')}>Current</button>
          <button style={modePill(mode === 'low')}     onClick={() => setMode('low')}>Low Stock</button>
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background: ACCENT, borderRadius: 8, padding: 20 }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px', fontSize: 22, fontWeight: 'bold', color: '#000' }}>
          Inventory - {mode === 'current' ? 'Current' : 'Low Stock'}
        </h2>

        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 14, minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BORDER}` }}>
                {['Item', 'Category', 'Stock Amount', 'Status'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 'bold', fontSize: 14 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={4} style={{ padding: 10, color: GRAY }}>Loading...</td></tr>
                : displayed.map(item => (
                  <tr
                    key={item.name}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setHoveredName(item.name)}
                    onMouseLeave={() => setHoveredName(null)}
                    style={{
                      borderBottom: `1px solid ${BORDER}`,
                      background: selectedName === item.name ? '#DBEAFE' : hoveredName === item.name ? '#F3F4F6' : '#fff',
                      cursor: 'pointer',
                      height: 26,
                    }}
                  >
                    <td style={{ padding: '7px 10px' }}>{item.name}</td>
                    <td style={{ padding: '7px 10px' }}>{item.category}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right' }}>{item.stock}</td>
                    <td style={{ padding: '7px 10px' }}>{item.status}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Editor */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 14 }}>Item:</label>
          <input style={input(120)} value={nameField} onChange={e => setNameField(e.target.value)} />
          <label style={{ fontSize: 14 }}>Category:</label>
          <input style={input(100)} value={typeField} onChange={e => setTypeField(e.target.value)} />
          <label style={{ fontSize: 14 }}>Quantity:</label>
          <input style={input(70)}  value={qtyField}  onChange={e => setQtyField(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addItem}    disabled={loading} style={{ ...btn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Add</button>
          <button onClick={updateItem} disabled={loading} style={{ ...btn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Update Selected</button>
          <button onClick={deleteItem} disabled={loading} style={{ ...btn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Delete Item</button>
        </div>
      </div>
    </div>
  );
}
