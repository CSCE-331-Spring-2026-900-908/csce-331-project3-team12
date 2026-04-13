'use client';

import { useState } from 'react';
import AnalyticsView from './AnalyticsView';
import EmployeesView from './EmployeesView';
import InventoryView from './InventoryView';

type Tab = 'analytics' | 'inventory' | 'employees';

const BG       = '#F4F6F8';
const ACCENT   = '#FFDC78';
const PURPLE   = '#7B3FF2';
const PURPLE_L = '#9A66F5';
const TEXT     = '#1F2933';

const TABS: { key: Tab; label: string }[] = [
  { key: 'analytics', label: 'Analytics' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'employees', label: 'Employees' },
];

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'sans-serif' }}>

      {/* Header bar — matches Java Header with purple bottom border */}
      <div style={{
        borderBottom: `2px solid ${PURPLE}`,
        padding: '12px 40px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: 20, color: PURPLE }}>Boba Shop</span>
      </div>

      <div style={{ padding: '20px 40px 40px' }}>

        {/* Title row: "Manager Dashboard" + Back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', color: TEXT, margin: 0 }}>
            Manager Dashboard
          </h1>
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              background: PURPLE_L,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '6px 14px',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Back
          </button>
        </div>

        {/* Nav pills — gray container, 4 buttons, active=white inactive=yellow */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            background: '#F0F0F0',
            borderRadius: 18,
            padding: 4,
            width: 420,
            height: 44,
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: activeTab === tab.key ? '#fff' : ACCENT,
                  border: 'none',
                  borderRadius: 16,
                  fontWeight: 'bold',
                  fontSize: 13,
                  color: activeTab === tab.key ? '#000' : '#333',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'employees' && <EmployeesView />}
      </div>
    </div>
  );
}
