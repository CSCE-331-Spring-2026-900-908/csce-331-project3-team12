'use client';

import { useState } from 'react';

const ACCENT = '#FFDC78';
const BORDER = '#E5E7EB';

interface Employee {
  id: number;
  name: string;
  hourlyPay: number;
  position: string;
  pin: number;
}

const seed: Employee[] = [
  { id: 1, name: 'Alice Johnson', hourlyPay: 15.50, position: 'Manager', pin: 1234 },
  { id: 2, name: 'Bob Smith',     hourlyPay: 12.00, position: 'Cashier', pin: 5678 },
  { id: 3, name: 'Carol Davis',   hourlyPay: 13.25, position: 'Kitchen', pin: 9012 },
  { id: 4, name: 'David Wilson',  hourlyPay: 11.75, position: 'Server',  pin: 3456 },
];

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>(seed);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [hourly, setHourly] = useState('');
  const [position, setPosition] = useState('');
  const [pin, setPin] = useState('');

  function select(emp: Employee) {
    setSelectedId(emp.id);
    setName(emp.name);
    setHourly(String(emp.hourlyPay));
    setPosition(emp.position);
    setPin(String(emp.pin));
  }

  function clear() {
    setName(''); setHourly(''); setPosition(''); setPin('');
    setSelectedId(null);
  }

  function add() {
    if (!name || !hourly || !position || !pin) { alert('Please fill in all fields.'); return; }
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    setEmployees(prev => [...prev, { id: newId, name, hourlyPay: parseFloat(hourly), position, pin: parseInt(pin) }]);
    clear();
  }

  function update() {
    if (selectedId === null) { alert('Select a row first.'); return; }
    setEmployees(prev => prev.map(e =>
      e.id === selectedId
        ? { ...e, name, hourlyPay: parseFloat(hourly), position, pin: parseInt(pin) }
        : e
    ));
  }

  function remove() {
    if (selectedId === null) { alert('Select a row first.'); return; }
    if (!confirm('Are you sure you want to delete this employee?')) return;
    setEmployees(prev => prev.filter(e => e.id !== selectedId));
    clear();
  }

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
    <div style={{ background: ACCENT, borderRadius: 8, padding: 20 }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px', fontSize: 18, fontWeight: 'bold', color: '#000' }}>
        Employees
      </h2>

      {/* Table */}
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
            {employees.map(emp => (
              <tr
                key={emp.id}
                onClick={() => select(emp)}
                style={{
                  borderBottom: `1px solid ${BORDER}`,
                  background: selectedId === emp.id ? '#DBEAFE' : '#fff',
                  cursor: 'pointer',
                  height: 26,
                }}
              >
                <td style={{ padding: '7px 10px' }}>{emp.id}</td>
                <td style={{ padding: '7px 10px' }}>{emp.name}</td>
                <td style={{ padding: '7px 10px' }}>{emp.hourlyPay.toFixed(2)}</td>
                <td style={{ padding: '7px 10px' }}>{emp.position}</td>
                <td style={{ padding: '7px 10px' }}>{emp.pin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor row 1: fields */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 14 }}>Name:</label>
        <input style={input(120)} value={name} onChange={e => setName(e.target.value)} />
        <label style={{ fontSize: 14 }}>Hourly Pay:</label>
        <input style={input(70)}  value={hourly} onChange={e => setHourly(e.target.value)} />
        <label style={{ fontSize: 14 }}>Position:</label>
        <input style={input(100)} value={position} onChange={e => setPosition(e.target.value)} />
        <label style={{ fontSize: 14 }}>PIN:</label>
        <input style={input(70)}  value={pin} onChange={e => setPin(e.target.value)} />
      </div>

      {/* Editor row 2: buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={add}    style={btn}>Add</button>
        <button onClick={update} style={btn}>Update Employee</button>
        <button onClick={remove} style={btn}>Delete Employee</button>
      </div>
    </div>
  );
}
