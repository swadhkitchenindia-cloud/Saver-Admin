import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const markCollected = async (id) => {
    await updateDoc(doc(db, 'orders', id), { status: 'collected', collectedAt: Date.now() });
    showToast('Order marked as collected.');
  };

  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab)
    .filter(o => !search || o.customerName?.toLowerCase().includes(search.toLowerCase()) || o.itemName?.toLowerCase().includes(search.toLowerCase()) || o.restaurantName?.toLowerCase().includes(search.toLowerCase()) || o.code?.toLowerCase().includes(search.toLowerCase()));

  const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.paidPrice || 0), 0);
  const totalFees = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.platformFee || 0), 0);
  const counts = { pending: orders.filter(o => o.status === 'pending').length, collected: orders.filter(o => o.status === 'collected').length, all: orders.length };

  return (
    <>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--green)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 300 }}>{toast}</div>}
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">Orders</div>
          <div className="admin-topbar-sub">{counts.all} total · ₹{totalRevenue.toLocaleString()} revenue · ₹{totalFees.toLocaleString()} platform fees</div>
        </div>
        <input className="search-input" placeholder="Search by name, item, code..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="admin-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total revenue', val: `₹${totalRevenue.toLocaleString()}`, icon: '💰' },
            { label: 'Platform fees (10%)', val: `₹${totalFees.toLocaleString()}`, icon: '📊' },
            { label: 'Restaurant payouts', val: `₹${(totalRevenue - totalFees).toLocaleString()}`, icon: '🏪' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div className="stat-card-val">{c.val}</div>
              <div className="stat-card-lbl">{c.label}</div>
            </div>
          ))}
        </div>
        <div className="tabs">
          {[{ id: 'pending', label: `Pending (${counts.pending})` }, { id: 'collected', label: `Collected (${counts.collected})` }, { id: 'all', label: `All (${counts.all})` }].map(t => (
            <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {loading ? <div className="spinner" /> : (
          <div className="table-card">
            {filtered.length === 0 ? <div className="empty"><div className="icon">📋</div><p>No orders found</p></div> : (
              <table className="admin-table">
                <thead>
                  <tr><th>Code</th><th>Item</th><th>Customer</th><th>Restaurant</th><th>Amount</th><th>Fee</th><th>Payout</th><th>Status</th><th>Time</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}>
                      <td><code style={{ fontSize: 12, background: 'var(--bg)', padding: '3px 7px', borderRadius: 4 }}>#{o.code}</code></td>
                      <td style={{ fontWeight: 600 }}>{o.itemName}</td>
                      <td>
                        <div>{o.customerName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{o.restaurantName}</td>
                      <td style={{ fontWeight: 700, color: 'var(--amber)' }}>₹{o.paidPrice}</td>
                      <td style={{ fontSize: 13, color: 'var(--red)' }}>₹{o.platformFee || 0}</td>
                      <td style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>₹{o.restaurantPayout || 0}</td>
                      <td><span className={`pill ${o.status === 'collected' ? 'pill-green' : 'pill-amber'}`}>{o.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{o.status === 'pending' && <button className="btn btn-approve" onClick={() => markCollected(o.id)}>Mark collected</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
