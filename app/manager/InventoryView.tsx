'use client';

import { useState } from 'react';

const ACCENT = '#FFDC78';
const BORDER = '#E5E7EB';

type Status = 'OK' | 'Low' | 'Critical';
type Mode = 'current' | 'low';

interface Item {
  name: string;
  category: string;
  stock: number;
  status: Status;
}

function computeStatus(stock: number): Status {
  if (stock <= 0) return 'Critical';
  if (stock <= 30) return 'Low';
  return 'OK';
}

const seed: Item[] = [
  { name: 'Tapioca Pearls',   category: 'Toppings',   stock: 150, status: 'OK'       },
  { name: 'Milk',             category: 'Dairy',       stock: 45,  status: 'Low'      },
  { name: 'Brown Sugar',      category: 'Sweeteners',  stock: 200, status: 'OK'       },
  { name: 'Matcha Powder',    category: 'Powders',     stock: 8,   status: 'Critical' },
  { name: 'Taro Powder',      category: 'Powders',     stock: 85,  status: 'OK'       },
  { name: 'Grass Jelly',      category: 'Toppings',    stock: 0,   status: 'Critical' },
  { name: 'Strawberry Syrup', category: 'Syrups',      stock: 120, status: 'OK'       },
  { name: 'Mango Syrup',      category: 'Syrups',      stock: 25,  status: 'Low'      },
];

export default function InventoryView() {
  const [inventory, setInventory] = useState<Item[]>(seed);
  const [mode, setMode] = useState<Mode>('current');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [nameField, setNameField] = useState('');
  const [typeField, setTypeField] = useState('');
  const [qtyField, setQtyField] = useState('');

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

  function addItem() {
    if (!nameField || !typeField || !qtyField) { alert('Please fill in all fields.'); return; }
    const qty = parseInt(qtyField);
    if (isNaN(qty)) { alert('Quantity must be a number.'); return; }
    const status = computeStatus(qty);
    setInventory(prev => {
      const idx = prev.findIndex(i => i.name === nameField);
      if (idx >= 0) return prev.map((i, n) => n === idx ? { ...i, category: typeField, stock: qty, status } : i);
      return [...prev, { name: nameField, category: typeField, stock: qty, status }];
    });
  }

  function updateItem() {
    if (!selectedName) { alert('Select a row in the table to update.'); return; }
    if (!qtyField) { alert('Enter a new quantity.'); return; }
    const qty = parseInt(qtyField);
    if (isNaN(qty)) { alert('Quantity must be a number.'); return; }
    setInventory(prev => prev.map(i =>
      i.name === selectedName
        ? { ...i, category: typeField, stock: qty, status: computeStatus(qty) }
        : i
    ));
  }

  function deleteItem() {
    if (!selectedName) { alert('Select a row first.'); return; }
    if (!confirm('Are you sure you want to delete this item?')) return;
    setInventory(prev => prev.filter(i => i.name !== selectedName));
    setSelectedName(null);
    setNameField(''); setTypeField(''); setQtyField('');
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
    border: '1px solid #ccc',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 14,
    width,
  });

  const btn: React.CSSProperties = {
    background: '#555',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
  };

  return (
    <div>
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
              {displayed.map(item => (
                <tr
                  key={item.name}
                  onClick={() => selectItem(item)}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: selectedName === item.name ? '#DBEAFE' : '#fff',
                    cursor: 'pointer',
                    height: 26,
                  }}
                >
                  <td style={{ padding: '7px 10px' }}>{item.name}</td>
                  <td style={{ padding: '7px 10px' }}>{item.category}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{item.stock}</td>
                  <td style={{ padding: '7px 10px' }}>{item.status}</td>
                </tr>
              ))}
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
          <button onClick={addItem}    style={btn}>Add</button>
          <button onClick={updateItem} style={btn}>Update Selected</button>
          <button onClick={deleteItem} style={btn}>Delete Item</button>
        </div>
      </div>
    </div>
  );
}
