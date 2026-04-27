'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

const CARD_STYLE: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e9d5ff',
  borderRadius: 16,
  padding: '20px 18px',
  width: 260,
  cursor: 'pointer',
  textAlign: 'left',
  boxShadow: '0 8px 30px rgba(76, 29, 149, 0.08)',
};

export default function ManagerPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(140deg, #ede9fe 0%, #f5f3ff 45%, #faf5ff 100%)',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 760, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 34, color: '#4c1d95', fontWeight: 800 }}>Manager View</h1>
        <p style={{ marginTop: 10, color: '#6b7280', fontSize: 16 }}>
          Choose where to navigate for this shift.
        </p>

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/manager/dashboard')} style={CARD_STYLE}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4c1d95' }}>Manager Dashboard</div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
              Open analytics, inventory, and employee tools.
            </div>
          </button>

          <button onClick={() => router.push('/cashier')} style={CARD_STYLE}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4c1d95' }}>Cashier View</div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
              Jump directly into order taking and checkout.
            </div>
          </button>
        </div>

        <button
          onClick={() => router.push('/')}
          style={{
            marginTop: 28,
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid #d8b4fe',
            background: '#ffffff',
            color: '#6d28d9',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Back to Portal
        </button>
      </div>
    </div>
  );
}
