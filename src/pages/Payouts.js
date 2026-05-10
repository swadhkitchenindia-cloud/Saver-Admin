import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';

export default function Payouts() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    return onSnapshot(collection(db, 'orders'), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'restaurant'));
    return onSnapshot(q, snap => {
      const map = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      setRestaurants(map);
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Group paid orders by restaurant
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const byRestaurant = {};
  paidOrders.forEach(o => {
    if (!byRestaurant[o.restaurantId]) {
      byRestaurant[o.restaurantId] = { restaurantId: o.restaurantId, restaurantName: o.restaurantName, orders: [], pending: 0, paid: 0 };
    }
    byRestaurant[o.restaurantId].orders.push(o);
    if (o.restaurantPayoutStatus === 'pending') byRestaurant[o.restaurantId].pending += (o.restaurantPayout || 0);
    if (o.restaurantPayoutStatus === 'paid') byRestaurant[o.restaurantId].paid += (o.restaurantPayout || 0);
  });

  const payoutList = Object.values(byRestaurant)
    .filter(r => !search || r.restaurantName?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.pending - a.pending);

  const totalPending = payoutList.reduce((s, r) => s + r.pending, 0);
  const totalPaid = payoutList.reduce((s, r) => s + r.paid, 0);

  const markPaid = async (restaurantId) => {
    const pendingOrders = orders.filter(o => o.restaurantId === restaurantId && o.restaurantPayoutStatus === 'pending' && o.paymentStatus === 'paid');
    await Promise.all(pendingOrders.map(o =>
      updateDoc(doc(db, 'orders', o.id), { restaurantPayoutStatus: 'paid', payoutDate: Date.now() })
    ));
    showToast(`✅ Marked ${pendingOrders.length} orders as paid out.`);
  };

  const restaurant = (id) => restaurants[id] || {};

  return (
    <>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--green)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 300 }}>{toast}</div>}

      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">Payouts</div>
          <div className="admin-topbar-sub">₹{totalPending.toLocaleString()} pending · ₹{totalPaid.toLocaleString()} paid out</div>
        </div>
        <input className="search-input" placeholder="Search restaurant..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="admin-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending payouts', val: `₹${totalPending.toLocaleString()}`, icon: '⏳', warn: totalPending > 0 },
            { label: 'Total paid out', val: `₹${totalPaid.toLocaleString()}`, icon: '✅' },
            { label: 'Restaurants owed', val: payoutList.filter(r => r.pending > 0).length, icon: '🏪' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div className="stat-card-val" style={{ color: c.warn ? 'var(--amber)' : undefined }}>{c.val}</div>
              <div className="stat-card-lbl">{c.label}</div>
            </div>
          ))}
        </div>

        {totalPending > 0 && (
          <div className="alert alert-warn" style={{ marginBottom: 20 }}>
            ⚠️ <b>₹{totalPending.toLocaleString()}</b> is pending payout to restaurants. Transfer and mark as paid below.
          </div>
        )}

        {loading ? <div className="spinner" /> : (
          <div className="table-card">
            {payoutList.length === 0 ? (
              <div className="empty"><div className="icon">💰</div><p>No payout data yet</p></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Restaurant</th><th>Bank / UPI</th><th>Orders</th><th>Pending</th><th>Paid out</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {payoutList.map(r => {
                    const info = restaurant(r.restaurantId);
                    return (
                      <tr key={r.restaurantId}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{r.restaurantName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{info.location}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {info.bankAccount || info.upi || <span style={{ color: 'var(--red)', fontWeight: 600 }}>Not set</span>}
                        </td>
                        <td style={{ fontWeight: 600 }}>{r.orders.length}</td>
                        <td>
                          <span style={{ fontWeight: 800, color: r.pending > 0 ? 'var(--amber)' : 'var(--text-muted)', fontSize: 15 }}>
                            {r.pending > 0 ? `₹${r.pending.toLocaleString()}` : '—'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>
                          {r.paid > 0 ? `₹${r.paid.toLocaleString()}` : '—'}
                        </td>
                        <td>
                          {r.pending > 0 ? (
                            <button className="btn btn-approve" onClick={() => markPaid(r.restaurantId)}>
                              Mark ₹{r.pending.toLocaleString()} paid ✓
                            </button>
                          ) : (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>All settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>📋 Payout process</div>
          <ol style={{ paddingLeft: 18 }}>
            <li>Customer pays Saver via Razorpay</li>
            <li>Saver holds the amount (10% platform fee deducted)</li>
            <li>Transfer remaining 90% to restaurant's bank/UPI</li>
            <li>Click "Mark paid" above to update records</li>
            <li>Restaurants can see their payout status in their dashboard</li>
          </ol>
        </div>
      </div>
    </>
  );
}
