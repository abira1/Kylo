import React, { useState, useCallback } from 'react';
import { CreditCard, Download, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeData } from '../../hooks/useData';
import { subscribeToInvoices, Invoice } from '../../services/dataService';

export function Payments() {
  const { user, loading: authLoading } = useAuth();
  const [cardSaved, setCardSaved] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const subscribe = useCallback((cb: (data: Invoice[]) => void) => {
    if (user?.uid) {
      return subscribeToInvoices(user.uid, cb);
    }
    cb([]);
    return () => {};
  }, [user?.uid]);

  const { data: invoices, loading: dataLoading } = useRealtimeData<Invoice[]>(
    subscribe,
    []
  );

  if (authLoading) {
    return <LoadingState />;
  }

  const totalInvoices = Array.isArray(invoices) ? invoices.length : 0;
  const totalSpent = calculateTotalSpent(invoices);
  const paidInvoices = Array.isArray(invoices) ? invoices.filter(inv => inv.status === 'Paid').length : 0;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Payments</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
          Manage your subscription and billing history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Invoices" value={totalInvoices.toString()} icon="📊" />
        <StatCard title="Total Spent" value={`$${totalSpent}`} icon="💰" />
        <StatCard title="Paid Invoices" value={paidInvoices.toString()} icon="✓" />
      </div>

      <PaymentMethodCard onSave={() => setCardSaved(true)} cardSaved={cardSaved} />

      <BillingHistorySection
        invoices={invoices}
        loading={dataLoading}
        downloadingId={downloadingId}
        onDownload={setDownloadingId}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-navy-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function PaymentMethodCard({ onSave, cardSaved }: { onSave: () => void; cardSaved: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState('25');

  const handleSave = () => {
    if (validateCard(cardNumber, expiryMonth, expiryYear)) {
      onSave();
      setIsEditing(false);
      setTimeout(() => setCardSaved(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-navy-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Payment Method</h2>

      {!isEditing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Visa ending in</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">•••• •••• •••• {cardNumber}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Expires {expiryMonth}/{expiryYear}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors">
            Update Card
          </button>
        </div>
      ) : (
        <CardEditForm
          cardNumber={cardNumber}
          expiryMonth={expiryMonth}
          expiryYear={expiryYear}
          onCardChange={setCardNumber}
          onMonthChange={setExpiryMonth}
          onYearChange={setExpiryYear}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}

      {cardSaved && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Check size={20} />
          <span className="font-medium">Card saved successfully</span>
        </div>
      )}
    </div>
  );
}

interface CardEditFormProps {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  onCardChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

function CardEditForm({
  cardNumber,
  expiryMonth,
  expiryYear,
  onCardChange,
  onMonthChange,
  onYearChange,
  onCancel,
  onSave
}: CardEditFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => onCardChange(e.target.value.replace(/\D/g, '').slice(0, 16))}
          maxLength={16}
          className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg dark:bg-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="4242 4242 4242 4242"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
          <select
            value={expiryMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg dark:bg-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
          <select
            value={expiryYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg dark:bg-navy-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {Array.from({ length: 10 }, (_, i) => String(2025 + i).slice(-2)).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors">
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors">
          Save Card
        </button>
      </div>
    </div>
  );
}

interface BillingHistorySectionProps {
  invoices: Invoice[];
  loading: boolean;
  downloadingId: string | null;
  onDownload: (id: string | null) => void;
}

function BillingHistorySection({ invoices, loading, downloadingId, onDownload }: BillingHistorySectionProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-navy-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Billing History</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(invoices) || invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-navy-700 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No invoices yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden">
      <div className="p-8 border-b border-gray-100 dark:border-navy-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-navy-900 border-b border-gray-100 dark:border-navy-700">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Invoice</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Plan</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-navy-700">
            {invoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isDownloading={downloadingId === invoice.id}
                onDownload={() => {
                  onDownload(invoice.id);
                  setTimeout(() => onDownload(null), 2000);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface InvoiceRowProps {
  invoice: Invoice;
  isDownloading: boolean;
  onDownload: () => void;
}

function InvoiceRow({ invoice, isDownloading, onDownload }: InvoiceRowProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: any) => {
    const num = Number(amount);
    return !isNaN(num) ? `$${num.toFixed(2)}` : '$0.00';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
      case 'Pending':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition-colors">
      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(invoice.date)}</td>
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{invoice.plan}</td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{formatAmount(invoice.amount)}</td>
      <td className="px-6 py-4 text-sm">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(invoice.status)}`}>
          {invoice.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold disabled:opacity-50 inline-flex items-center gap-1">
          <Download size={16} />
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
      </td>
    </tr>
  );
}

function calculateTotalSpent(invoices: any[]): string {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return '0.00';
  }

  let total = 0;
  for (const inv of invoices) {
    const amount = Number(inv.amount);
    if (!isNaN(amount)) {
      total += amount;
    }
  }

  return total.toFixed(2);
}

function validateCard(cardNumber: string, month: string, year: string): boolean {
  if (!cardNumber || cardNumber.length < 13) {
    alert('Invalid card number');
    return false;
  }
  if (!month || !year) {
    alert('Please select expiry date');
    return false;
  }
  return true;
}