import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({ restaurants: 0, pending: 0, customers: 0, listings: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [];

    // All users
    unsubs.push(onSnapshot(collection(db, 'users'), snap => {
      const users = snap.docs.map(d => d.data());
      const restaurants = users.filter(u => u.role === 'restaurant').length;
      const pending = users.filter(u => u.role === 'restaurant' && u.verificationStatus === 'pending').length;
      const customers = users.filter(u => u.role === 'customer').length;
      setStats(s => ({ ...s, restaurants, pending, customers }));
      setLoading(false);
    }));

    // Listings
    unsubs.push(onSnapshot(query(collection(db, 'listings'), where('status', '==', 'active')), snap => {
      setStats(s => ({ ...s, listings: snap.size }));
    }));

    // Orders
    unsubs.push(onSnapshot(collection(db, 'orders'), snap => {
      const orders = snap.docs.map(d => d.data());
      const revenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.paidPrice || 0), 0);
      setStats(s => ({ ...s, orders: snap.size, revenue }));
    }));

    // Recent orders
    unsubs.push(onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)),
      snap => setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ));

    return () => unsubs.forEach(u => u());
  }, []);

  const statCards = [
    { icon: '🏪', label: 'Restaurants', value: stats.restaurants, sub: `${stats.pending} pending approval`, amber: stats.pending > 0 },
    { icon: '👥', label: 'Customers', value: stats.customers, sub: 'Registered users' },
    { icon: '🍽️', label: 'Live listings', value: stats.listings, sub: 'Active right now' },
    { icon: '💰', label: 'Total revenue', value: `₹${stats.revenue.toLocaleString()}`, sub: `${stats.orders} orders`, green: true },
  ];

  return (
    <>
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">Dashboard</div>
          <div className="admin-topbar-sub">Welcome back — here's what's happening on Saver</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="admin-content">
        {loading ? <div className="spinner" /> : (
          <>
            <div className="stat-grid">
              {statCards.map(card => (
                <div key={card.label} className={`stat-card${card.green ? ' green' : ''}`}>
                  <div className="stat-card-icon">{card.icon}</div>
                  <div className="stat-card-val">{card.value}</div>
                  <div className="stat-card-lbl">{card.label}</div>
                  {card.sub && (
                    <div style={{ fontSize: 12, marginTop: 6, color: card.green ? 'rgba(255,255,255,0.7)' : card.amber ? 'var(--amber)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {card.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {stats.pending > 0 && (
              <div className="alert alert-warn" style={{ marginBottom: 24 }}>
                ⚠️ <b>{stats.pending} restaurant{stats.pending > 1 ? 's' : ''}</b> waiting for verification. Go to Restaurants tab to review.
              </div>
            )}

            <div className="section-title">Recent orders</div>
            <div className="table-card">
              {recentOrders.length === 0 ? (
                <div className="empty"><div className="icon">📋</div><p>No orders yet</p></div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Item</th>
                      <th>Customer</th>
                      <th>Restaurant</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o.id}>
                        <td><code style={{ fontSize: 12, background: 'var(--bg)', padding: '3px 7px', borderRadius: 4 }}>#{o.code}</code></td>
                        <td style={{ fontWeight: 600 }}>{o.itemName}</td>
                        <td>{o.customerName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{o.restaurantName}</td>
                        <td style={{ fontWeight: 700, color: 'var(--amber)' }}>₹{o.paidPrice}</td>
                        <td><span className={`pill ${o.status === 'collected' ? 'pill-green' : 'pill-amber'}`}>{o.status}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
