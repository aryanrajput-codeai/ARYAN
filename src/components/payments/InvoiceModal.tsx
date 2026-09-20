import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { Payment, Subscription } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateDisplay } from '../../lib/dateUtils';
import { Printer, Download, MessageCircle, FileText, CheckCircle2, Building2, User, CreditCard } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: Payment | null;
  subscription?: Subscription | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  payment,
  subscription,
}) => {
  const { settings } = useData();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [includeGst, setIncludeGst] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!payment && !subscription) return null;

  // Resolve target details
  const targetClient = payment?.client || subscription?.client;
  const targetSub = payment?.subscription || subscription;
  const targetProduct = targetSub?.product;
  const targetPlan = targetSub?.plan;

  const invoiceNumber = payment?.receipt_number
    ? payment.receipt_number.replace('WR-PAY-', 'WR-INV-2026-')
    : `WR-INV-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;

  const invoiceDate = payment?.payment_date || targetSub?.start_date || new Date().toISOString().slice(0, 10);
  const totalAmount = payment?.amount || targetSub?.amount || 0;

  // Tax calculations if GST enabled (18% inclusive or additive)
  const baseAmount = includeGst ? Math.round(totalAmount / 1.18) : totalAmount;
  const gstAmount = totalAmount - baseAmount;
  const cgstAmount = Math.round(gstAmount / 2);
  const sgstAmount = gstAmount - cgstAmount;

  // PDF Export handler using html2pdf
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);

    try {
      const element = invoiceRef.current;
      const filename = `${settings.business_name.replace(/\s+/g, '_')}_Invoice_${invoiceNumber}.pdf`;

      const options = {
        margin: 10,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.warn('PDF generation notice:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!targetClient?.phone) {
      alert('Client does not have a phone number registered.');
      return;
    }
    const cleanPhone = targetClient.phone.replace(/\D/g, '');
    const clientName = targetClient.business_name;
    const prodName = targetProduct?.name || 'Software Subscription';
    const planName = targetPlan?.name || 'Annual License';
    const formattedAmount = formatCurrency(totalAmount);

    const message = `Hello ${clientName},\n\n` +
      `Here is your Tax Invoice from *${settings.business_name}*:\n\n` +
      `📄 *Invoice No:* ${invoiceNumber}\n` +
      `📅 *Date:* ${formatDateDisplay(invoiceDate)}\n` +
      `💻 *Service:* ${prodName} (${planName})\n` +
      `💰 *Total Amount:* ${formattedAmount}\n\n` +
      `Thank you for your business!\n` +
      `*${settings.business_name}*`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tax Invoice & Bill Generator"
      subtitle={`Invoice #${invoiceNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 select-none">
        {/* Top Controls Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">GST Tax Breakdown:</span>
            <button
              type="button"
              onClick={() => setIncludeGst(!includeGst)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                includeGst
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-300 text-slate-700'
              }`}
            >
              {includeGst ? 'GST 18% Included' : 'No GST (Exempt)'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18A86B] hover:bg-[#148F5B] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </button>
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Printable & Downloadable Invoice Document Container */}
        <div className="overflow-y-auto max-h-[65vh] p-1">
          <div
            ref={invoiceRef}
            id="printable-tax-invoice"
            className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 font-sans text-slate-900"
          >
            {/* 1. Invoice Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                    W
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-wider text-slate-900 uppercase">
                      {settings.business_name}
                    </h1>
                    <p className="text-[11px] text-indigo-600 font-bold tracking-wider uppercase">
                      Software & Digital Solutions
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  {settings.address}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-1 font-mono">
                  {settings.gstin && (
                    <span>
                      GSTIN: <strong className="text-slate-800">{settings.gstin}</strong>
                    </span>
                  )}
                  {settings.phone && <span>Phone: {settings.phone}</span>}
                  {settings.email && <span>Email: {settings.email}</span>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black rounded-lg uppercase tracking-wider mb-2">
                  {includeGst ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                </span>
                <p className="text-base font-black font-mono text-slate-900">{invoiceNumber}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Invoice Date: {formatDateDisplay(invoiceDate)}
                </p>
              </div>
            </div>

            {/* 2. Bill To & Payment Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5" /> Customer Details (Billed To)
                </span>
                <p className="text-sm font-bold text-slate-900">{targetClient?.business_name || 'Valued Client'}</p>
                {targetClient?.owner_name && (
                  <p className="text-slate-600 font-medium mt-0.5">Contact: {targetClient.owner_name}</p>
                )}
                {targetClient?.address && (
                  <p className="text-slate-500 mt-0.5">
                    {targetClient.address}, {targetClient.city} {targetClient.state} {targetClient.pincode}
                  </p>
                )}
                {targetClient?.gstin && (
                  <p className="text-slate-600 font-mono mt-0.5 font-semibold">GSTIN: {targetClient.gstin}</p>
                )}
                {targetClient?.phone && <p className="text-slate-500 mt-0.5">Phone: {targetClient.phone}</p>}
              </div>

              <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center sm:justify-end gap-1 mb-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment Status & Mode
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{payment ? 'PAID & CONFIRMED' : 'ACTIVE SUBSCRIPTION'}</span>
                </div>
                {payment && (
                  <>
                    <p className="text-slate-600 font-medium">
                      Method: <strong className="text-slate-900">{payment.payment_method}</strong>
                    </p>
                    {payment.transaction_reference && (
                      <p className="text-slate-500 font-mono truncate text-[11px] mt-0.5">
                        Ref: {payment.transaction_reference}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 3. Itemized Services Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item & License Description</th>
                    <th className="p-3 text-center">Plan Term</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-500">01</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 text-sm">
                        {targetProduct?.name || 'WebRajya SaaS Software'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {targetProduct?.description || 'Cloud Business Management System'}
                      </p>
                      {targetSub?.start_date && targetSub?.end_date && (
                        <p className="text-[11px] text-indigo-600 font-medium mt-1">
                          License Validity: {formatDateDisplay(targetSub.start_date)} to{' '}
                          {formatDateDisplay(targetSub.end_date)}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700">
                      {targetPlan?.name || '1 Year License'}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">1</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(baseAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Summary Calculation Block */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-semibold">{formatCurrency(baseAmount)}</span>
                </div>

                {includeGst && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (9%):</span>
                      <span className="font-mono">{formatCurrency(cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (9%):</span>
                      <span className="font-mono">{formatCurrency(sgstAmount)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total Payable:</span>
                  <span className="font-mono text-indigo-700 text-base">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Payment Bank & UPI Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
              <div>
                <span className="font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                  Bank & UPI Details
                </span>
                <p className="text-slate-700">
                  Bank Name: <strong className="font-semibold text-slate-900">HDFC Bank</strong>
                </p>
                <p className="text-slate-700">
                  A/C Number: <strong className="font-mono text-slate-900">50200012345678</strong>
                </p>
                <p className="text-slate-700">
                  IFSC Code: <strong className="font-mono text-slate-900">HDFC0001234</strong>
                </p>
                <p className="text-slate-700">
                  UPI ID: <strong className="font-mono text-indigo-700">webrajya@hdfcbank</strong>
                </p>
              </div>

              <div className="text-right flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Terms & Conditions
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Goods/Services once supplied are non-refundable. All software licenses are subject to annual renewal.
                  </p>
                </div>
                <div className="pt-3">
                  <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    For {settings.business_name}
                  </p>
                  <p className="font-mono text-[11px] font-bold text-indigo-700 mt-0.5">
                    Authorized Signatory
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Generating PDF...' : 'Download PDF Invoice'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
