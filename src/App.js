import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from './components/AdminAuth';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import Listings from './pages/Listings';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Payouts from './pages/Payouts';
import './index.css';
import { db } from './firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function AdminApp() {
  const { isLoggedIn } = useAdminAuth();
  const [page, setPage] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    const q = query(
      collection(db, 'users'),
      where('verificationStatus', '==', 'pending')
    );
    return onSnapshot(q, snap => setPendingCount(snap.size));
  }, [isLoggedIn]);

  if (!isLoggedIn) return <Login />;

  const pages = {
    dashboard: Dashboard,
    restaurants: Restaurants,
    listings: Listings,
    orders: Orders,
    customers: Customers,
    payouts: Payouts,
  };

  const PageComponent = pages[page] || Dashboard;

  return (
    <div className="admin-layout">
      <Sidebar page={page} setPage={setPage} pendingCount={pendingCount} />
      <div className="main">
        <PageComponent />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AdminApp />
    </AdminAuthProvider>
  );
}
