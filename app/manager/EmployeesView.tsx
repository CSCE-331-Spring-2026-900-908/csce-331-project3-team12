'use client';

import { useState, useEffect } from 'react';

const ACCENT = '#EDE9FE';
const BORDER = '#E5E7EB';
const GRAY   = '#6B7280';

interface Employee {
  employeeid: number;
  name:       string;
  hourlypay:  number;
  position:   string;
  pin:        number;
}

interface PayrollRow {
  employeeId: number;
  name: string;
  position: string;
  hourlyPay: number;
  hoursWorked: number;
  completedShifts: number;
  openShifts: number;
  grossPay: number;
}

interface PayrollResponse {
  from: string | null;
  to: string | null;
  rows: PayrollRow[];
  totals: {
    totalHours: number;
    totalGrossPay: number;
  };
}

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState('');
  const [payrollData, setPayrollData] = useState<PayrollResponse | null>(null);
  const [payrollFrom, setPayrollFrom] = useState('');
  const [payrollTo, setPayrollTo] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId]   = useState<number | null>(null);
  const [name,     setName]     = useState('');
  const [hourly,   setHourly]   = useState('');
  const [position, setPosition] = useState('');
  const [pin,      setPin]      = useState('');

  async function refresh() {
    setLoading(true);
    const res  = await fetch('/manager/api/employees');
    const json = await res.json();
    if (res.ok) setEmployees(json);
    setLoading(false);
  }

  async function refreshPayroll(from = payrollFrom, to = payrollTo) {
    setPayrollLoading(true);
    setPayrollError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/manager/api/payroll?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setPayrollError(json.error || 'Failed to load payroll data.');
        return;
      }
      setPayrollData(json);
    } catch {
      setPayrollError('Failed to load payroll data.');
    } finally {
      setPayrollLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    refreshPayroll('', '');
  }, []);

  function select(emp: Employee) {
    setSelectedId(emp.employeeid);
    setName(emp.name);
    setHourly(String(emp.hourlypay));
    setPosition(emp.position);
    setPin(String(emp.pin));
  }

  function clear() {
    setSelectedId(null);
    setName(''); setHourly(''); setPosition(''); setPin('');
  }

  async function add() {
    if (!name || !hourly || !position || !pin) { alert('Please fill in all fields.'); return; }
    const res  = await fetch('/manager/api/employees', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, hourlyPay: hourly, position, pin }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    clear();
    refresh();
  }

  async function update() {
    if (selectedId === null) { alert('Select a row first.'); return; }
    const res  = await fetch('/manager/api/employees', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: selectedId, name, hourlyPay: hourly, position, pin }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    refresh();
  }

  async function remove() {
    if (selectedId === null) { alert('Select a row first.'); return; }
    if (!confirm('Are you sure you want to delete this employee?')) return;
    const res  = await fetch('/manager/api/employees', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: selectedId }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    clear();
    refresh();
  }

  const input = (width: number): React.CSSProperties => ({
    border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: 14, width,
  });

  const btn: React.CSSProperties = {
    background: '#555', color: '#fff', border: 'none',
    borderRadius: 4, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
  };

  const money = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ background: ACCENT, borderRadius: 8, padding: 20 }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px', fontSize: 18, fontWeight: 'bold', color: '#000' }}>
        Employees
      </h2>

      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 14, minWidth: 600 }}>
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${BORDER}` }}>
              {['ID', 'Name', 'Hourly Pay', 'Position', 'PIN'].map(col => (
                <th key={col} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 'bold', fontSize: 14 }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ padding: 10, color: GRAY }}>Loading...</td></tr>
              : employees.map(emp => (
                <tr
                  key={emp.employeeid}
                  onClick={() => select(emp)}
                  onMouseEnter={() => setHoveredId(emp.employeeid)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: selectedId === emp.employeeid ? '#DBEAFE' : hoveredId === emp.employeeid ? '#F3F4F6' : '#fff',
                    cursor: 'pointer',
                    height: 26,
                  }}
                >
                  <td style={{ padding: '7px 10px' }}>{emp.employeeid}</td>
                  <td style={{ padding: '7px 10px' }}>{emp.name}</td>
                  <td style={{ padding: '7px 10px' }}>{parseFloat(String(emp.hourlypay)).toFixed(2)}</td>
                  <td style={{ padding: '7px 10px' }}>{emp.position}</td>
                  <td style={{ padding: '7px 10px' }}>{emp.pin}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Editor fields */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 14 }}>Name:</label>
        <input style={input(120)} value={name}     onChange={e => setName(e.target.value)} />
        <label style={{ fontSize: 14 }}>Hourly Pay:</label>
        <input style={input(70)}  value={hourly}   onChange={e => setHourly(e.target.value)} />
        <label style={{ fontSize: 14 }}>Position:</label>
        <input style={input(100)} value={position} onChange={e => setPosition(e.target.value)} />
        <label style={{ fontSize: 14 }}>PIN:</label>
        <input style={input(70)}  value={pin}      onChange={e => setPin(e.target.value)} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={add}    disabled={loading} style={{ ...btn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Add</button>
        <button onClick={update} disabled={loading} style={{ ...btn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Update Employee</button>
        <button onClick={remove} disabled={loading} style={{ ...btn, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Delete Employee</button>
      </div>

      <div style={{ marginTop: 22, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
        <h3 style={{ margin: 0, marginBottom: 10, color: '#111827' }}>Payroll Breakdown</h3>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <label style={{ fontSize: 13 }}>From:</label>
          <input
            value={payrollFrom}
            onChange={e => setPayrollFrom(e.target.value)}
            placeholder='YYYY-MM-DD'
            style={input(120)}
          />
          <label style={{ fontSize: 13 }}>To:</label>
          <input
            value={payrollTo}
            onChange={e => setPayrollTo(e.target.value)}
            placeholder='YYYY-MM-DD'
            style={input(120)}
          />
          <button
            onClick={() => refreshPayroll()}
            disabled={payrollLoading}
            style={{ ...btn, opacity: payrollLoading ? 0.5 : 1, cursor: payrollLoading ? 'not-allowed' : 'pointer' }}
          >
            Calculate Payroll
          </button>
        </div>

        {payrollError && <div style={{ color: '#b91c1c', marginBottom: 10 }}>{payrollError}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                {['ID', 'Name', 'Position', 'Hourly', 'Hours', 'Completed Shifts', 'Open Shifts', 'Gross Pay'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 'bold' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrollLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 10, color: GRAY }}>Calculating payroll...</td>
                </tr>
              ) : (payrollData?.rows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 10, color: GRAY }}>No employees found.</td>
                </tr>
              ) : (
                (payrollData?.rows ?? []).map(row => (
                  <tr key={row.employeeId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '7px 8px' }}>{row.employeeId}</td>
                    <td style={{ padding: '7px 8px' }}>{row.name}</td>
                    <td style={{ padding: '7px 8px' }}>{row.position}</td>
                    <td style={{ padding: '7px 8px' }}>${money(row.hourlyPay)}</td>
                    <td style={{ padding: '7px 8px' }}>{row.hoursWorked.toFixed(2)}</td>
                    <td style={{ padding: '7px 8px' }}>{row.completedShifts}</td>
                    <td style={{ padding: '7px 8px' }}>{row.openShifts}</td>
                    <td style={{ padding: '7px 8px', fontWeight: 700 }}>${money(row.grossPay)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, fontWeight: 700, color: '#111827' }}>
          Total Hours: {(payrollData?.totals.totalHours ?? 0).toFixed(2)} | Total Gross Payroll: ${money(payrollData?.totals.totalGrossPay ?? 0)}
        </div>
      </div>
    </div>
  );
}
