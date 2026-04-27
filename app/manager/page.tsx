'use client';

import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
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
  const { data: session, status } = useSession();

  // ── Loading state ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(140deg, #ede9fe 0%, #f5f3ff 45%, #faf5ff 100%)',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: '#6b7280', fontSize: 18 }}>Checking authentication…</p>
      </div>
    );
  }

  // ── Not signed in — show Google sign-in ────────────────────────────────────
  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(140deg, #ede9fe 0%, #f5f3ff 45%, #faf5ff 100%)',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h1 style={{ margin: 0, fontSize: 30, color: '#4c1d95', fontWeight: 800 }}>
            Manager Login
          </h1>
          <p style={{ marginTop: 10, color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>
            Sign in with an authorized Google account to access the manager dashboard.
          </p>

          <button
            onClick={() => signIn('google')}
            style={{
              marginTop: 28,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 28px',
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={() => router.push('/')}
            style={{
              display: 'block',
              margin: '20px auto 0',
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid #d8b4fe',
              background: '#ffffff',
              color: '#6d28d9',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  // ── Signed in — original manager menu ──────────────────────────────────────
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
        {/* User badge + sign out */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: '#fff',
          border: '1px solid #e9d5ff',
          borderRadius: 50,
          padding: '6px 8px 6px 16px',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(76, 29, 149, 0.06)',
        }}>
          {session.user?.image && (
            <img
              src={session.user.image}
              alt=""
              width={28}
              height={28}
              style={{ borderRadius: '50%' }}
              referrerPolicy="no-referrer"
            />
          )}
          <span style={{ fontSize: 14, color: '#374151' }}>{session.user?.email}</span>
          <button
            onClick={() => signOut()}
            style={{
              marginLeft: 4,
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid #d8b4fe',
              background: '#faf5ff',
              color: '#6d28d9',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Sign out
          </button>
        </div>

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
