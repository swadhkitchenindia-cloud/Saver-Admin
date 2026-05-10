import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

function DetailModal({ restaurant, onClose, onApprove, onReject }) {
  if (!restaurant) return null;
  const fields = [
    ['Business name', restaurant.businessName],
    ['Business type', restaurant.businessType],
    ['Location', restaurant.location],
    ['Full address', restaurant.address],
    ['Phone', restaurant.phone],
    ['Email', restaurant.email],
    ['Owner name', restaurant.ownerName],
    ['Owner phone', restaurant.ownerPhone],
    ['FSSAI number', restaurant.fssaiNumber],
    ['FSSAI expiry', restaurant.fssaiExpiry],
    ['Description', restaurant.description],
    ['Status', restaurant.verificationStatus],
    ['Applied on', restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString('en-IN') : '—'],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>🏪 {restaurant.businessName}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {restaurant.verificationStatus === 'pending' && (
          <div className="alert alert-warn">⏳ This restaurant is awaiting your verification</div>
        )}
        {restaurant.verificationStatus === 'approved' && (
          <div className="alert alert-success">✅ This restaurant is approved and active</div>
        )}

        <div style={{ marginBottom: 20 }}>
          {fields.map(([label, value]) => value ? (
            <div key={label} className="detail-row">
              <div className="detail-label">{label}</div>
              <div className="detail-value">{value}</div>
            </div>
          ) : null)}
        </div>

        {restaurant.verificationStatus === 'pending' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-approve" style={{ flex: 1, padding: '12px' }}
              onClick={() => onApprove(restaurant.id)}>
              ✅ Approve & Activate
            </button>
            <button className="btn btn-reject" style={{ flex: 1, padding: '12px' }}
              onClick={() => onReject(restaurant.id)}>
              ❌ Reject
            </button>
          </div>
        )}
        {restaurant.verificationStatus === 'approved' && (
          <button className="btn btn-reject" style={{ width: '100%', padding: '12px' }}
            onClick={() => onReject(restaurant.id)}>
            Suspend restaurant
          </button>
        )}
      </div>
    </div>
  );
}

export default function Restaurants() {
  const [all, setAll] = useState([]);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'restaurant'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAll(data);
      setLoading(false);
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const approve = async (id) => {
    await updateDoc(doc(db, 'users', id), { verificationStatus: 'approved', canList: true, approvedAt: Date.now() });
    setSelected(null);
    showToast('✅ Restaurant approved! They can now post listings.');
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional — will be visible in records):');
    await updateDoc(doc(db, 'users', id), { verificationStatus: 'rejected', canList: false, rejectedAt: Date.now(), rejectionReason: reason || '' });
    setSelected(null);
    showToast('Restaurant rejected.');
  };

  const filtered = all
    .filter(r => tab === 'all' || r.verificationStatus === tab)
    .filter(r => !search || r.businessName?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    pending: all.filter(r => r.verificationStatus === 'pending').length,
    approved: all.filter(r => r.verificationStatus === 'approved').length,
    rejected: all.filter(r => r.verificationStatus === 'rejected').length,
    all: all.length,
  };

  const statusPill = (status) => {
    if (status === 'approved') return <span className="pill pill-green">Approved</span>;
    if (status === 'pending') return <span className="pill pill-amber">Pending</span>;
    if (status === 'rejected') return <span className="pill pill-red">Rejected</span>;
    return <span className="pill pill-gray">{status}</span>;
  };

  return (
    <>
      {selected && <DetailModal restaurant={selected} onClose={() => setSelected(null)} onApprove={approve} onReject={reject} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--green)', color: 'white', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 300, boxShadow: 'var(--shadow-md)' }}>
          {toast}
        </div>
      )}

      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">Restaurants</div>
          <div className="admin-topbar-sub">{counts.pending} pending verification · {counts.approved} active partners</div>
        </div>
        <input className="search-input" placeholder="Search by name or location..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="admin-content">
        <div className="tabs">
          {[
            { id: 'pending', label: `Pending (${counts.pending})` },
            { id: 'approved', label: `Approved (${counts.approved})` },
            { id: 'rejected', label: `Rejected (${counts.rejected})` },
            { id: 'all', label: `All (${counts.all})` },
          ].map(t => (
            <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-card">
            {filtered.length === 0 ? (
              <div className="empty">
                <div className="icon">{tab === 'pending' ? '🎉' : '🏪'}</div>
                <p>{tab === 'pending' ? 'No pending applications!' : 'No restaurants found'}</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Owner</th>
                    <th>Location</th>
                    <th>FSSAI</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{r.businessName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.businessType}</div>
                      </td>
                      <td>
                        <div>{r.ownerName || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.ownerPhone || r.phone}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.location}</td>
                      <td>
                        <code style={{ fontSize: 12, background: 'var(--bg)', padding: '3px 7px', borderRadius: 4 }}>
                          {r.fssaiNumber || '—'}
                        </code>
                        {r.fssaiExpiry && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Exp: {r.fssaiExpiry}</div>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>{statusPill(r.verificationStatus)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-view" onClick={() => setSelected(r)}>View</button>
                          {r.verificationStatus === 'pending' && (
                            <>
                              <button className="btn btn-approve" onClick={() => approve(r.id)}>✅</button>
                              <button className="btn btn-reject" onClick={() => reject(r.id)}>❌</button>
                            </>
                          )}
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
