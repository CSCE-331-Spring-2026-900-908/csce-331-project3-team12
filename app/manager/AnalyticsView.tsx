'use client';

import { useState, useEffect, useCallback } from 'react';

const TEXT   = '#1F2933';
const BORDER = '#E5E7EB';
const PURPLE = '#7B3FF2';
const PURPLE_XL = '#EDE9FE';
const GRAY   = '#6B7280';

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Kpis {
  totalRevenue: number;
  totalOrders:  number;
  avgOrder:     number;
  itemsSold:    number;
}
interface DailyRow    { date: string; revenue: number }
interface UsageRow    { ingredient: string; used: number }
interface HourlyRow   { hour: string; orders: number; revenue: number }

interface AnalyticsData {
  kpis:         Kpis;
  dailySales:   DailyRow[];
  productUsage: UsageRow[];
  hourly:       HourlyRow[];
}

export default function AnalyticsView() {
  const [fromDate, setFromDate]   = useState('');
  const [toDate,   setToDate]     = useState('');
  const [dateLabel, setDateLabel] = useState('All Time');
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchData = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to)   params.set('to', to);
      const res = await fetch(`/manager/api/analytics?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleApply() {
    if (fromDate && toDate) setDateLabel(`${fromDate} to ${toDate}`);
    else if (fromDate)      setDateLabel(fromDate);
    else                    setDateLabel('All Time');
    fetchData(fromDate || undefined, toDate || undefined);
  }

  async function handleZReport() {
    const res  = await fetch('/manager/api/analytics', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    alert(
      `Z-Report for ${json.date}:\n` +
      `Total Revenue: ${fmt(json.totalRevenue)}\n` +
      `Tip Revenue: ${fmt(json.tipRevenue)}\n` +
      `Total Orders: ${json.totalOrders}\n\n` +
      `Business day closed. Z-Report complete!`
    );
    fetchData(fromDate || undefined, toDate || undefined);
  }

  const kpiCards = data
    ? [
        { label: 'Total Revenue',   value: fmt(data.kpis.totalRevenue) },
        { label: 'Total Orders',    value: String(data.kpis.totalOrders) },
        { label: 'Avg Order Value', value: fmt(data.kpis.avgOrder) },
        { label: 'Items Sold',      value: String(data.kpis.itemsSold) },
      ]
    : [
        { label: 'Total Revenue',   value: '—' },
        { label: 'Total Orders',    value: '—' },
        { label: 'Avg Order Value', value: '—' },
        { label: 'Items Sold',      value: '—' },
      ];

  return (
    <div>
      {/* Z-Report + date label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button
          onClick={handleZReport}
          style={{ background: PURPLE, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}
        >
          Generate Z-Report
        </button>
        <span style={{ color: GRAY, fontSize: 16 }}>{dateLabel}</span>
      </div>

      {/* Date range filter */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <label style={{ fontSize: 14 }}>From:</label>
        <input value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="YYYY-MM-DD"
          style={{ border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: 110 }} />
        <label style={{ fontSize: 14 }}>To:</label>
        <input value={toDate} onChange={e => setToDate(e.target.value)} placeholder="YYYY-MM-DD"
          style={{ border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: 110 }} />
        <button onClick={handleApply}
          style={{ padding: '4px 14px', fontSize: 14, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}>
          Apply
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '12px 16px' }}>
            <div style={{ color: GRAY, fontSize: 16, marginBottom: 10 }}>{k.label}</div>
            <div style={{ color: TEXT, fontSize: 26, fontWeight: 'bold' }}>
              {loading ? '...' : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts — 3 cards */}
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
                {loading
                  ? <tr><td colSpan={2} style={{ padding: 8, color: GRAY }}>Loading...</td></tr>
                  : (data?.dailySales ?? []).map(row => (
                    <tr key={row.date} style={{ borderBottom: `1px solid ${BORDER}`, height: 28 }}>
                      <td style={{ padding: '6px 4px' }}>{row.date}</td>
                      <td style={{ padding: '6px 4px' }}>{fmt(row.revenue)}</td>
                    </tr>
                  ))
                }
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
                {loading
                  ? <tr><td colSpan={2} style={{ padding: 8, color: GRAY }}>Loading...</td></tr>
                  : (data?.productUsage ?? []).map(row => (
                    <tr key={row.ingredient} style={{ borderBottom: `1px solid ${BORDER}`, height: 28 }}>
                      <td style={{ padding: '6px 4px' }}>{row.ingredient}</td>
                      <td style={{ padding: '6px 4px' }}>{row.used}</td>
                    </tr>
                  ))
                }
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
                {loading
                  ? <tr><td colSpan={3} style={{ padding: 8, color: GRAY }}>Loading...</td></tr>
                  : (data?.hourly ?? []).map(row => (
                    <tr key={row.hour} style={{ borderBottom: `1px solid ${BORDER}`, height: 28 }}>
                      <td style={{ padding: '6px 4px' }}>{row.hour}</td>
                      <td style={{ padding: '6px 4px' }}>{row.orders}</td>
                      <td style={{ padding: '6px 4px' }}>{fmt(row.revenue)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
