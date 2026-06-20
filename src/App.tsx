import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboardLayout } from './components/AdminDashboardLayout';
import { AdminHome } from './pages/admin/Home';
import { AdminSessions } from './pages/admin/Sessions';
import { AdminClients } from './pages/admin/Clients';
import { AdminKnowledge } from './pages/admin/Knowledge';
import { AdminPackages } from './pages/admin/Packages';
import { AdminAnalytics } from './pages/admin/Analytics';
import { AdminSettings } from './pages/admin/Settings';
// Dashboard Pages
import { Home } from './pages/dashboard/Home';
import { Embed } from './pages/dashboard/Embed';
import { Leads } from './pages/dashboard/Leads';
import { Conversations } from './pages/dashboard/Conversations';
import { WhatsApp } from './pages/dashboard/WhatsApp';
import { Training } from './pages/dashboard/Training';
import { Analytics } from './pages/dashboard/Analytics';
import { Payments } from './pages/dashboard/Payments';
import { Settings } from './pages/dashboard/Settings';
// Firebase initialization
import './firebase/config';

export function App() {
  useEffect(() => {
    // Log Firebase initialization
    console.log('✅ Firebase initialized and ready');
  }, []);
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute isAdmin={true}>
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminHome />} />
            <Route path="sessions" element={<AdminSessions />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="knowledge" element={<AdminKnowledge />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="embed" element={<Embed />} />
            <Route path="leads" element={<Leads />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="training" element={<Training />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>);

}