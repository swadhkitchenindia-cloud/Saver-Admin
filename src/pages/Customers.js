import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'customer'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCustomers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'orders'), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const getCustomerStats = (customerId) => {
    const customerOrders = orders.filter(o => o.customerId === customerId && o.paymentStatus === 'paid');
    const totalSpent = customerOrders.reduce((s, o) => s + (o.paidPrice || 0), 0);
    const totalSaved = customerOrders.reduce((s, o) => s + (o.savedAmount || 0), 0);
    return { orderCount: customerOrders.length, totalSpent, totalSaved };
  };

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => orders.some(o => o.customerId === c.id)).length;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">Customers</div>
          <div className="admin-topbar-sub">{totalCustomers} registered · {activeCustomers} have ordered</div>
        </div>
        <input className="search-input" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="admin-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total customers', val: totalCustomers, icon: '👥' },
            { label: 'Active customers', val: activeCustomers, icon: '🛍️' },
            { label: 'Conversion rate', val: totalCustomers > 0 ? `${Math.round(activeCustomers / totalCustomers * 100)}%` : '0%', icon: '📈' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div className="stat-card-val">{c.val}</div>
              <div className="stat-card-lbl">{c.label}</div>
            </div>
          ))}
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-card">
            {filtered.length === 0 ? (
              <div className="empty"><div className="icon">👥</div><p>No customers found</p></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Name</th><th>Phone</th><th>Orders</th><th>Total spent</th><th>Total saved</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const stats = getCustomerStats(c.id);
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
                              {c.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div style={{ fontWeight: 600 }}>{c.name || 'Unknown'}</div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: stats.orderCount > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                            {stats.orderCount}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--amber)' }}>
                          {stats.totalSpent > 0 ? `₹${stats.totalSpent.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>
                          {stats.totalSaved > 0 ? `₹${stats.totalSaved.toLocaleString()}` : '—'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
