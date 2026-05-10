import React from 'react';
import { useAdminAuth } from './AdminAuth';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  restaurants: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h18l-2 7H5L3 2z"/><path d="M5 9v13h14V9"/><line x1="9" y1="14" x2="15" y2="14"/></svg>,
  listings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  orders: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  payouts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
};

export default function Sidebar({ page, setPage, pendingCount }) {
  const { logout } = useAdminAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'restaurants', label: 'Restaurants', icon: icons.restaurants, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'listings', label: 'Live Listings', icon: icons.listings },
    { id: 'orders', label: 'Orders', icon: icons.orders },
    { id: 'customers', label: 'Customers', icon: icons.customers },
    { id: 'payouts', label: 'Payouts', icon: icons.payouts },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ fontSize: 28, marginBottom: 6 }}>🍊</div>
        <div className="sidebar-logo-name">Saver</div>
        <div className="sidebar-logo-sub">Admin Panel</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button key={item.id} className={`nav-link${page === item.id ? ' active' : ''}`}
            onClick={() => setPage(item.id)}>
            {item.icon}
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Admin</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>admin@saver.in</div>
          </div>
        </div>
        <button onClick={logout}
          style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
