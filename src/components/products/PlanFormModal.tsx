import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Plan, Product } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct?: Product | null;
  planToEdit?: Plan | null;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
  planToEdit,
}) => {
  const { addPlan, updatePlan } = useData();
  const { addToast } = useToast();

  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [price, setPrice] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (planToEdit) {
      setProductId(planToEdit.product_id);
      setName(planToEdit.name || '');
      setDurationMonths(planToEdit.duration_months || 12);
      setPrice(planToEdit.price || 0);
      setDescription(planToEdit.description || '');
      setIsActive(planToEdit.is_active ?? true);
    } else {
      setProductId(selectedProduct?.id || products[0]?.id || '');
      setName('');
      setDurationMonths(12);
      setPrice(10000);
      setDescription('');
      setIsActive(true);
    }
  }, [planToEdit, selectedProduct, products, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      addToast('Please select a product', 'error');
      return;
    }
    if (!name.trim()) {
      addToast('Plan name is required', 'error');
      return;
    }
    if (durationMonths <= 0) {
      addToast('Duration must be at least 1 month', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (planToEdit) {
        await updatePlan(planToEdit.id, {
          product_id: productId,
          name: name.trim(),
          duration_months: durationMonths,
          price,
          description: description.trim() || null,
          is_active: isActive,
        });
      } else {
        await addPlan({
          product_id: productId,
          name: name.trim(),
          duration_months: durationMonths,
          price,
          description: description.trim() || null,
          is_active: isActive,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save plan';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={planToEdit ? 'Edit Pricing Plan' : 'Add Pricing Plan'}
      subtitle="Define billing cycle duration in months and standard license price"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Product *
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Plan Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual Premium (1 Year)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Duration (Months) *
            </label>
            <input
              type="number"
              min="1"
              max="120"
              required
              value={durationMonths}
              onChange={(e) => setDurationMonths(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Standard Price (₹) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Plan Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key plan inclusions or terms..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="plan-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <label htmlFor="plan-active" className="text-sm font-medium text-slate-700">
            Active plan
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : planToEdit ? 'Update Plan' : 'Add Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
