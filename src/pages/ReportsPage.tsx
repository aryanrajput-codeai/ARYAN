import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  PieChart,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../lib/dateUtils';
import { Payment, Product, Subscription, Client } from '../types';

export const ReportsPage: React.FC = () => {
  const { subscriptions, payments, products, clients } = useData();

  // Monthly breakdown for the past 6 calendar months
  const monthlyData = useMemo(() => {
    const result: { monthKey: string; monthLabel: string; total: number; count: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7); // "YYYY-MM"
      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

      const monthPayments = payments.filter((p: Payment) => p.payment_date.startsWith(monthKey));
      const total = monthPayments.reduce((acc: number, p: Payment) => acc + p.amount, 0);

      result.push({
        monthKey,
        monthLabel,
        total,
        count: monthPayments.length,
      });
    }

    return result;
  }, [payments]);

  // Product Revenue Contribution
  const productRevenue = useMemo(() => {
    return products.map((prod: Product) => {
      const prodPayments = payments.filter((p: Payment) => p.subscription?.product_id === prod.id);
      const total = prodPayments.reduce((acc: number, p: Payment) => acc + p.amount, 0);
      const activeSubs = subscriptions.filter(
        (s: Subscription) => s.product_id === prod.id && (s.status === 'ACTIVE' || s.status === 'EXPIRING_SOON')
      ).length;
      return {
        id: prod.id,
        name: prod.name,
        total,
        activeSubs,
      };
    });
  }, [products, payments, subscriptions]);

  // Total collections
  const totalCollections = payments.reduce((acc: number, p: Payment) => acc + p.amount, 0);

  // Clients with outstanding dues
  const clientsWithDues = useMemo(() => {
    return subscriptions
      .filter((s: Subscription) => (s.outstanding_balance || 0) > 0)
      .map((s: Subscription) => ({
        id: s.id,
        clientName: s.client?.business_name || 'Client',
        productName: s.product?.name || 'Software',
        dueAmount: s.outstanding_balance || 0,
        totalAmount: s.amount,
        endDate: s.end_date,
      }));
  }, [subscriptions]);

  const totalDues = clientsWithDues.reduce((sum: number, c: { dueAmount: number }) => sum + c.dueAmount, 0);

  const maxMonthValue = Math.max(...monthlyData.map((m) => m.total), 1);

  // Export Financial Report CSV
  const handleExportCSV = () => {
    const headers = ['Month', 'Collections (INR)', 'Receipts Count'];
    const rows = monthlyData.map((m) => [m.monthLabel, m.total, m.count]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WebRajya_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Financial & Performance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Revenue trends, product portfolio contribution, and accounts receivable tracking
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Summary CSV</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue Realized</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {formatCurrency(totalCollections)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">From {payments.length} settled receipts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Accounts Receivable</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 font-mono">
            {formatCurrency(totalDues)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {clientsWithDues.length} partial/pending subscriptions
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Client Base</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {clients.filter((c: Client) => c.status === 'ACTIVE').length} / {clients.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {subscriptions.filter((s: Subscription) => s.status === 'ACTIVE').length} active licenses
          </p>
        </div>
      </div>

      {/* Monthly Collections Trend visualizer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Monthly Revenue Trend (Last 6 Months)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Calculated from settled payment receipts</p>
          </div>
        </div>

        {/* CSS-based Bar Visualizer */}
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 border-b border-slate-200">
          {monthlyData.map((m) => {
            const heightPercent = Math.max(8, Math.round((m.total / maxMonthValue) * 100));
            return (
              <div key={m.monthKey} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] sm:text-xs font-mono font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{(m.total / 1000).toFixed(0)}k
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] bg-indigo-600 group-hover:bg-indigo-700 rounded-t-md transition-all shadow-xs"
                />
                <span className="text-[11px] font-semibold text-slate-500 text-center truncate w-full">
                  {m.monthLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Monthly Table Summary */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2">Month</th>
                <th className="py-2">Receipts Issued</th>
                <th className="py-2 text-right">Collections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map((m) => (
                <tr key={m.monthKey} className="hover:bg-slate-50">
                  <td className="py-2.5 font-medium text-slate-800">{m.monthLabel}</td>
                  <td className="py-2.5 text-slate-600">{m.count} payments</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(m.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two columns: Product Breakdown & Dues Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-indigo-600" /> Revenue by Product Module
          </h2>

          <div className="space-y-4">
            {productRevenue.map((p) => {
              const pct = totalCollections > 0 ? Math.round((p.total / totalCollections) * 100) : 0;
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {formatCurrency(p.total)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-indigo-600 rounded-full"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">{p.activeSubs} active licenses</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outstanding Dues Detail */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-600" /> Outstanding Balances Due
          </h2>

          {clientsWithDues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No outstanding dues pending across active clients!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Client & Product</th>
                    <th className="p-2.5">Contract Total</th>
                    <th className="p-2.5 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientsWithDues.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <p className="font-semibold text-slate-900">{item.clientName}</p>
                        <p className="text-[11px] text-slate-400">{item.productName}</p>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                        {formatCurrency(item.dueAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
