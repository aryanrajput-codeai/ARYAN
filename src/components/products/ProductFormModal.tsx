import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Product } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct } = useData();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      setIsActive(productToEdit.is_active ?? true);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Product name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (productToEdit) {
        await updateProduct(productToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          is_active: isActive,
        });
      } else {
        await addProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          is_active: isActive,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product' : 'Add New Product'}
      subtitle="Define a software solution or SaaS product module"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. RESTOBIZ"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Restaurant POS and billing platform with KOT support"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="product-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <label htmlFor="product-active" className="text-sm font-medium text-slate-700">
            Active for new subscriptions
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
            {isSubmitting ? 'Saving...' : productToEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
