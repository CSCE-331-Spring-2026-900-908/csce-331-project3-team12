'use client';

import { useState } from 'react';

const TEXT = '#1F2933';
const BORDER = '#E5E7EB';
const PURPLE = '#7B3FF2';
const GRAY_TEXT = '#6B7280';

const dailySales = [
  { date: '2024-01-15', revenue: '$1,234.50' },
  { date: '2024-01-16', revenue: '$987.25' },
  { date: '2024-01-17', revenue: '$1,456.00' },
  { date: '2024-01-18', revenue: '$2,103.75' },
  { date: '2024-01-19', revenue: '$1,789.00' },
  { date: '2024-01-20', revenue: '$2,456.50' },
  { date: '2024-01-21', revenue: '$1,203.25' },
];

const productUsage = [
  { ingredient: 'Tapioca Pearls', used: 1245 },
  { ingredient: 'Milk', used: 987 },
  { ingredient: 'Brown Sugar', used: 834 },
  { ingredient: 'Matcha Powder', used: 612 },
  { ingredient: 'Taro Powder', used: 489 },
  { ingredient: 'Strawberry Syrup', used: 402 },
  { ingredient: 'Mango Syrup', used: 378 },
];

const hourlyData = [
  { hour: '10:00', orders: 12, revenue: '$312.50' },
  { hour: '11:00', orders: 23, revenue: '$598.75' },
  { hour: '12:00', orders: 45, revenue: '$1,123.00' },
  { hour: '13:00', orders: 38, revenue: '$987.25' },
  { hour: '14:00', orders: 29, revenue: '$754.50' },
  { hour: '15:00', orders: 31, revenue: '$806.75' },
  { hour: '16:00', orders: 28, revenue: '$728.00' },
  { hour: '17:00', orders: 42, revenue: '$1,092.50' },
  { hour: '18:00', orders: 35, revenue: '$910.25' },
];

const kpis = [
  { label: 'Total Revenue', value: '$45,230.50' },
  { label: 'Total Orders', value: '1,243' },
  { label: 'Avg Order Value', value: '$36.39' },
  { label: 'Items Sold', value: '3,891' },
];

export default function AnalyticsView() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateLabel, setDateLabel] = useState('All Time');

  function handleApply() {
    if (fromDate && toDate) setDateLabel(`${fromDate} to ${toDate}`);
    else if (fromDate) setDateLabel(fromDate);
    else setDateLabel('All Time');
  }

  function handleZReport() {
    alert(
      'Z-Report for today:\n' +
      'Total Revenue: $4,523.25\n' +
      'Tip Revenue: $342.50\n' +
      'Total Orders: 124\n\n' +
      'Business day closed. Z-Report complete!'
    );
  }

  return (
    <div>
      {/* Z-Report button + date label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button
          onClick={handleZReport}
          style={{
            background: PURPLE,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Generate Z-Report
        </button>
        <span style={{ color: GRAY_TEXT, fontSize: 16 }}>{dateLabel}</span>
      </div>

      {/* Date range filter */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <label style={{ fontSize: 14 }}>From:</label>
        <input
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          placeholder="YYYY-MM-DD"
          style={{ border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: 110 }}
        />
        <label style={{ fontSize: 14 }}>To:</label>
        <input
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          placeholder="YYYY-MM-DD"
          style={{ border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: 110 }}
        />
        <button
          onClick={handleApply}
          style={{ padding: '4px 14px', fontSize: 14, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}
        >
          Apply
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        {kpis.map(k => (
          <div
            key={k.label}
            style={{
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: '12px 16px',
            }}
          >
            <div style={{ color: GRAY_TEXT, fontSize: 16, marginBottom: 10 }}>{k.label}</div>
            <div style={{ color: TEXT, fontSize: 26, fontWeight: 'bold' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Section — 3 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 25, marginBottom: 20 }}>

        {/* Daily Sales */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 'bold', color: TEXT }}>Daily Sales</h3>
          <div style={{ overflowY: 'auto', maxHeight: 260 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Date', 'Revenue'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 'bold', borderBottom: `1px solid ${BORDER}` }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailySales.map(row => (
                  <tr key={row.date} style={{ borderBottom: `1px solid ${BORDER}`, height: 28 }}>
                    <td style={{ padding: '6px 4px' }}>{row.date}</td>
                    <td style={{ padding: '6px 4px' }}>{row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Usage */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 'bold', color: TEXT }}>Product Usage</h3>
          <div style={{ overflowY: 'auto', maxHeight: 260 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Ingredient', 'Used'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 'bold', borderBottom: `1px solid ${BORDER}` }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productUsage.map(row => (
                  <tr key={row.ingredient} style={{ borderBottom: `1px solid ${BORDER}`, height: 28 }}>
                    <td style={{ padding: '6px 4px' }}>{row.ingredient}</td>
                    <td style={{ padding: '6px 4px' }}>{row.used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* X-Report */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 6, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 'bold', color: TEXT }}>X-Report (Hourly Sales)</h3>
          <div style={{ overflowY: 'auto', maxHeight: 260 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Hour', 'Orders', 'Revenue'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 'bold', borderBottom: `1px solid ${BORDER}` }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hourlyData.map(row => (
                  <tr key={row.hour} style={{ borderBottom: `1px solid ${BORDER}`, height: 28 }}>
                    <td style={{ padding: '6px 4px' }}>{row.hour}</td>
                    <td style={{ padding: '6px 4px' }}>{row.orders}</td>
                    <td style={{ padding: '6px 4px' }}>{row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
