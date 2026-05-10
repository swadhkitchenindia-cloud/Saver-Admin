import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const removeListing = async (id) => {
    if (!window.confirm('Remove this listing? Customers will no longer see it.')) return;
    await deleteDoc(doc(db, 'listings', id));
    showToast('Listing removed.');
  };

  const toggleStatus = async (listing) => {
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    await updateDoc(doc(db, 'listings', listing.id), { status: newStatus });
    showToast(`Listing ${newStatus}.`);
  };

  const filtered = listings
    .filter(l => tab === 'all' || l.status === tab)
    .filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.restaurantName?.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    active: listings.filter(l => l.status === 'active').length,
    sold_out: listings.filter(l => l.status === 'sold_out').length,
    all: listings.length,
  };

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--green)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 300 }}>
          {toast}
        </div>
      )}
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">Live Listings</div>
          <div className="admin-topbar-sub">{counts.active} active · {counts.sold_out} sold out</div>
        </div>
        <input className="search-input" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="admin-content">
        <div className="tabs">
          {[{ id: 'active', label: `Active (${counts.active})` }, { id: 'sold_out', label: `Sold out (${counts.sold_out})` }, { id: 'all', label: `All (${counts.all})` }].map(t => (
            <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {loading ? <div className="spinner" /> : (
          <div className="table-card">
            {filtered.length === 0 ? <div className="empty"><div className="icon">🍽️</div><p>No listings found</p></div> : (
              <table className="admin-table">
                <thead>
                  <tr><th>Item</th><th>Restaurant</th><th>Price</th><th>Qty left</th><th>Pickup by</th><th>Location</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 20 }}>{l.emoji || '🍽️'}</span>
                          <div>
                            <div style={{ fontWeight: 700 }}>{l.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.category}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{l.restaurantName}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--amber)' }}>₹{l.discountedPrice}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 6 }}>₹{l.originalPrice}</span>
                        <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{l.discount}% off</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{l.quantityLeft}/{l.quantity}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{l.pickupBy}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {l.restaurantLocation}
                        {l.lat && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GPS ✓</div>}
                      </td>
                      <td>
                        <span className={`pill ${l.status === 'active' ? 'pill-green' : l.status === 'sold_out' ? 'pill-gray' : 'pill-amber'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {l.status === 'active' && <button className="btn btn-reject" onClick={() => toggleStatus(l)}>Pause</button>}
                          <button className="btn btn-reject" onClick={() => removeListing(l.id)}>Remove</button>
                        </div>
                      </td>
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
