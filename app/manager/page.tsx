'use client';

import { useState } from 'react';
import AnalyticsView from './AnalyticsView';
import EmployeesView from './EmployeesView';
import InventoryView from './InventoryView';

type Tab = 'analytics' | 'inventory' | 'employees';

const PURPLE   = '#7B3FF2';
const PURPLE_L = '#9A66F5';
const PURPLE_XL = '#EDE9FE';

const TABS: { key: Tab; label: string }[] = [
  { key: 'analytics', label: 'Analytics' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'employees', label: 'Employees' },
];

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3FF', fontFamily: 'sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background: PURPLE,
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: '0.3px' }}>
          Manager Dashboard
        </h1>
        <button
          onClick={() => (window.location.href = '/')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Back
        </button>
      </div>

      <div style={{ padding: '28px 40px 40px' }}>

        {/* Nav pills + Edit Menu button */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            background: PURPLE_XL,
            borderRadius: 18,
            padding: 4,
            width: 380,
            height: 44,
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: activeTab === tab.key ? PURPLE : 'transparent',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 'bold',
                  fontSize: 13,
                  color: activeTab === tab.key ? '#fff' : PURPLE_L,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => (window.location.href = '/manager/menu')}
            style={{
              background: PURPLE,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.2px',
            }}
          >
            Edit Menu →
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'employees' && <EmployeesView />}
      </div>
    </div>
  );
}
