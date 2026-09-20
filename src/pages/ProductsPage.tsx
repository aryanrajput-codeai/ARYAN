import React, { useState } from 'react';
import { Package, Plus, Edit2, Layers, CheckCircle, XCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Product, Plan, Subscription } from '../types';
import { formatCurrency } from '../lib/dateUtils';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { PlanFormModal } from '../components/products/PlanFormModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const ProductsPage: React.FC = () => {
  const { products, plans, subscriptions, updateProduct } = useData();

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [planProduct, setPlanProduct] = useState<Product | null>(null);

  const [toggleProduct, setToggleProduct] = useState<Product | null>(null);

  const handleToggleProductStatus = async (product: Product) => {
    await updateProduct(product.id, { is_active: !product.is_active });
    setToggleProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Products & Subscription Plans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure software products, billing durations, standard license pricing, and tier terms
          </p>
        </div>

        <button
          id="btn-add-product"
          onClick={() => {
            setProductToEdit(null);
            setIsProductModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Products and their Plans list */}
      <div className="space-y-6">
        {products.map((product: Product) => {
          const productPlans = plans.filter((p: Plan) => p.product_id === product.id);
          const subCount = subscriptions.filter((s: Subscription) => s.product_id === product.id).length;
          const activeSubCount = subscriptions.filter(
            (s: Subscription) => s.product_id === product.id && s.status === 'ACTIVE'
          ).length;

          return (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Product Header Strip */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      <Package className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">{product.name}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        product.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-xs text-slate-500 pl-10">{product.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-slate-500 pr-2">
                    <span>
                      <strong className="text-slate-800 font-semibold">{activeSubCount}</strong> active
                      licenses ({subCount} all-time)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setPlanProduct(product);
                      setPlanToEdit(null);
                      setIsPlanModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Plan</span>
                  </button>

                  <button
                    onClick={() => {
                      setProductToEdit(product);
                      setIsProductModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setToggleProduct(product)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                    title={product.is_active ? 'Archive Product' : 'Activate Product'}
                  >
                    {product.is_active ? (
                      <XCircle className="w-4 h-4 hover:text-rose-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 hover:text-emerald-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Plans Table */}
              <div className="p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Billing Plans & License Terms
                </h3>

                {productPlans.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No plans configured for this product. Click &ldquo;Add Plan&rdquo; to define pricing.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {productPlans.map((plan: Plan) => (
                      <div
                        key={plan.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-200 bg-white transition-colors group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {plan.name}
                            </h4>
                            <button
                              onClick={() => {
                                setPlanProduct(product);
                                setPlanToEdit(plan);
                                setIsPlanModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="Edit Plan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-xs text-slate-500 mb-2">
                            {plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''} Duration
                            {plan.description ? ` • ${plan.description}` : ''}
                          </p>
                        </div>

                        <div className="flex items-baseline justify-between pt-3 border-t border-slate-100 mt-2">
                          <span className="text-base font-bold text-slate-900 font-mono">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ₹{Math.round(plan.price / plan.duration_months).toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      <PlanFormModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setPlanToEdit(null);
          setPlanProduct(null);
        }}
        products={products}
        selectedProduct={planProduct}
        planToEdit={planToEdit}
      />

      {toggleProduct && (
        <ConfirmDialog
          isOpen={Boolean(toggleProduct)}
          onClose={() => setToggleProduct(null)}
          onConfirm={() => handleToggleProductStatus(toggleProduct)}
          title={toggleProduct.is_active ? 'Archive Product' : 'Activate Product'}
          message={`Are you sure you want to ${
            toggleProduct.is_active ? 'archive' : 'activate'
          } "${toggleProduct.name}"? Existing subscriptions will remain preserved.`}
          confirmLabel={toggleProduct.is_active ? 'Archive' : 'Activate'}
          confirmVariant={toggleProduct.is_active ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
};
