'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Boxes, Check, FolderOpenDot, Plus, Sparkles, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ImageUpload } from '@/components/image-upload';
import { SkeletonCard, TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SellerProduct {
  id: string;
  title: string;
  price: string | number;
  stockQty: number;
  status: string;
  ownerType: string;
  category: { name: string; slug: string } | null;
}

interface SellerProductVariant {
  id: string;
  name: string;
  options: Record<string, string>;
  priceDelta: string | number;
  stockQty: number;
  sku: string | null;
  isDefault: boolean;
}

interface VariantFormState {
  name: string;
  optionsText: string;
  priceDelta: string;
  stockQty: string;
  sku: string;
  isDefault: boolean;
}

const INITIAL_VARIANT_FORM: VariantFormState = {
  name: '',
  optionsText: '{}',
  priceDelta: '0',
  stockQty: '0',
  sku: '',
  isDefault: false,
};

function FormInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`input transition-all duration-200 focus:border-mn-teal focus:ring-2 focus:ring-mn-teal/15 ${className}`}
      {...props}
    />
  );
}

function FormTextarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`input transition-all duration-200 focus:border-mn-teal focus:ring-2 focus:ring-mn-teal/15 ${className}`}
      {...props}
    />
  );
}

export function SellerProductsClient() {
  const { token, user } = useAuth();
  const verified = Boolean(user?.seller?.isVerified);
  const kycStatus = user?.seller?.kycStatus;
  const rejectionReason = user?.seller?.rejectionReason;
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<SellerProductVariant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeProduct, setActiveProduct] = useState<SellerProduct | null>(null);
  const [variantForm, setVariantForm] = useState<VariantFormState>(INITIAL_VARIANT_FORM);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [data, categoryList] = await Promise.all([
        apiFetch<SellerProduct[]>('/seller/products', { token }),
        apiFetch<Category[]>('/categories'),
      ]);
      setProducts(data);
      setCategories(categoryList);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    if (!verified) {
      setError('Complete seller verification before creating products.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    const imageUrl = String(fd.get('imageUrl') ?? '').trim();
    try {
      await apiFetch('/seller/products', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: fd.get('title'),
          description: fd.get('description'),
          categoryId: fd.get('categoryId') || undefined,
          price: Number(fd.get('price')),
          stockQty: Number(fd.get('stockQty')),
          status: 'published',
          images: imageUrl ? [imageUrl] : [],
        }),
      });
      setShowForm(false);
      showSuccess('Product created successfully!');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function loadVariants(product: SellerProduct) {
    if (!token) return;
    setVariantsLoading(true);
    setError(null);
    setActiveProduct(product);
    setEditingVariantId(null);
    setVariantForm(INITIAL_VARIANT_FORM);
    try {
      const data = await apiFetch<SellerProductVariant[]>(
        `/seller/products/${product.id}/variants`,
        { token },
      );
      setVariants(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load variants');
    } finally {
      setVariantsLoading(false);
    }
  }

  function resetVariantEditor() {
    setEditingVariantId(null);
    setVariantForm(INITIAL_VARIANT_FORM);
  }

  async function handleVariantSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !activeProduct) return;

    let parsedOptions: Record<string, string> = {};
    try {
      parsedOptions = JSON.parse(variantForm.optionsText || '{}') as Record<string, string>;
    } catch {
      setError('Variant options must be valid JSON object');
      return;
    }

    try {
      setError(null);
      const payload = {
        name: variantForm.name,
        options: parsedOptions,
        priceDelta: Number(variantForm.priceDelta || 0),
        stockQty: Number(variantForm.stockQty || 0),
        sku: variantForm.sku || undefined,
        isDefault: variantForm.isDefault,
      };
      if (editingVariantId) {
        await apiFetch(`/seller/products/${activeProduct.id}/variants/${editingVariantId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify(payload),
        });
        showSuccess('Variant updated!');
      } else {
        await apiFetch(`/seller/products/${activeProduct.id}/variants`, {
          method: 'POST',
          token,
          body: JSON.stringify(payload),
        });
        showSuccess('Variant created!');
      }
      await loadVariants(activeProduct);
      resetVariantEditor();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save variant');
    }
  }

  function startEditVariant(variant: SellerProductVariant) {
    setEditingVariantId(variant.id);
    setVariantForm({
      name: variant.name,
      optionsText: JSON.stringify(variant.options ?? {}, null, 2),
      priceDelta: String(Number(variant.priceDelta)),
      stockQty: String(variant.stockQty),
      sku: variant.sku ?? '',
      isDefault: variant.isDefault,
    });
  }

  async function handleDeleteVariant(variantId: string) {
    if (!token || !activeProduct) return;
    try {
      setError(null);
      await apiFetch(`/seller/products/${activeProduct.id}/variants/${variantId}`, {
        method: 'DELETE',
        token,
      });
      showSuccess('Variant deleted');
      await loadVariants(activeProduct);
      if (editingVariantId === variantId) {
        resetVariantEditor();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete variant');
    }
  }

  return (
    <div className="animate-fade-in space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="brand-text text-2xl text-mn-teal">Products</h1>
          <p className="text-sm text-mn-mid">Manage listings, stock visibility, and product variants.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary inline-flex items-center gap-2"
          disabled={!verified}
          title={verified ? undefined : 'Complete verification before listing'}
          onClick={() => {
            if (!verified) return;
            setShowForm(!showForm);
          }}
        >
          <span className={`transition-transform ${showForm ? 'rotate-45' : ''}`}>
            <Plus className="h-4 w-4" />
          </span>
          {showForm ? 'Cancel' : 'Add product'}
        </button>
      </div>

      {!verified && (
        <div className="rounded-xl border border-mn-gold/30 bg-mn-cream p-4 text-sm text-mn-ink">
          {kycStatus === 'submitted' ? (
            <p>Your verification is pending admin review. Product listing unlocks after approval.</p>
          ) : kycStatus === 'rejected' ? (
            <p>
              Verification was rejected
              {rejectionReason ? `: ${rejectionReason}` : '.'}{' '}
              <a href="/seller/kyc" className="font-semibold text-mn-teal underline">
                Update and resubmit
              </a>
            </p>
          ) : (
            <p>
              Complete seller verification before creating products.{' '}
              <a href="/seller/kyc" className="font-semibold text-mn-teal underline">
                Continue verification
              </a>
            </p>
          )}
        </div>
      )}

      {successMessage && (
        <div className="animate-slide-up flex items-center gap-2 rounded-xl border border-mn-teal/20 bg-mn-teal-soft p-4 text-sm text-mn-teal">
          <Check className="h-5 w-5 text-mn-teal" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="animate-slide-up flex items-center justify-between rounded-xl border border-mn-accent/20 bg-mn-accent-soft p-4">
          <p className="text-sm text-mn-accent">{error}</p>
          <button type="button" onClick={() => setError(null)}>
            <X className="h-4 w-4 text-mn-accent" />
          </button>
        </div>
      )}

      {showForm && verified && (
        <form
          onSubmit={handleCreate}
          className="card animate-slide-up max-w-xl space-y-4 overflow-hidden rounded-xl border border-mn-teal/20 bg-white/95 p-6"
        >
          <FormInput name="title" placeholder="Title" required />
          <FormTextarea name="description" placeholder="Description" rows={3} />
          <ImageUpload token={token} name="imageUrl" label="Product image" />
          <select className="input" name="categoryId" defaultValue="" required>
            <option value="" disabled>
              Select category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-mn-mid">
              No categories yet. Ask your admin to create categories first.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormInput name="price" type="number" step="0.01" placeholder="Price" required />
            <FormInput name="stockQty" type="number" placeholder="Stock" defaultValue={10} />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Publish Product
          </button>
        </form>
      )}

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 rounded-xl border border-dashed border-mn-teal/30 p-12 text-center">
          <FolderOpenDot className="h-12 w-12 text-mn-teal" />
          <p className="text-lg font-semibold text-mn-teal">No products yet</p>
          <p className="text-sm text-mn-mid">Create your first product to start receiving orders.</p>
        </div>
      ) : (
        <div className="card overflow-hidden rounded-xl border border-mn-teal/20">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-mn-teal-soft/60 to-mn-teal-soft/30 text-left text-[11px] uppercase text-mn-mid">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Variants</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-border/40 transition-colors hover:bg-mn-teal-soft/30"
                >
                  <td className="p-4 font-medium text-mn-ink">{p.title}</td>
                  <td className="p-4 text-mn-mid">{p.category?.name ?? '—'}</td>
                  <td className="p-4 text-mn-ink">${Number(p.price).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={p.stockQty <= 5 ? 'font-semibold text-amber' : 'text-mn-ink'}>
                      {p.stockQty}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="badge bg-mn-teal-soft text-[10px] text-mn-teal">{p.ownerType}</span>
                  </td>
                  <td className="p-4 capitalize text-mn-ink">{p.status}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
                      onClick={() => loadVariants(p)}
                    >
                      <Boxes className="h-3.5 w-3.5" />
                      Manage variants
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeProduct && (
        <div className="card animate-slide-up mt-6 space-y-4 rounded-xl border border-mn-teal/20 bg-white/95 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 font-semibold text-mn-teal">
              <Sparkles className="h-4 w-4 text-mn-teal" />
              Variants for <span className="text-mn-teal">{activeProduct.title}</span>
            </h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setActiveProduct(null)}
            >
              Close
            </button>
          </div>

          {variantsLoading ? (
            <div className="grid gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="text-sm">
                    <p className="flex items-center gap-2 font-medium text-mn-ink">
                      {variant.name}
                      {variant.isDefault && (
                        <span className="rounded-full bg-mn-teal-soft px-2 py-0.5 text-[10px] text-mn-teal">
                          default
                        </span>
                      )}
                    </p>
                    <p className="text-mn-mid">
                      Delta: ${Number(variant.priceDelta).toFixed(2)} | Stock: {variant.stockQty}
                    </p>
                    <p className="mt-1 text-xs text-mn-mid">
                      Options: {JSON.stringify(variant.options ?? {})}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => startEditVariant(variant)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm border-mn-accent/30 text-mn-accent hover:bg-mn-accent-soft"
                      onClick={() => handleDeleteVariant(variant.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {variants.length === 0 && (
                <div className="rounded-xl border border-dashed border-mn-teal/30 p-6 text-center text-sm text-mn-mid">
                  No variants yet. Create the first variant below.
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleVariantSubmit} className="space-y-4 border-t border-border/40 pt-5">
            <h3 className="font-medium text-mn-teal">
              {editingVariantId ? 'Edit variant' : 'Add variant'}
            </h3>
            <FormInput
              name="name"
              placeholder="Name (e.g. Size)"
              value={variantForm.name}
              onChange={(event) => setVariantForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <FormTextarea
              name="options"
              placeholder='Options JSON (e.g. {"size":"M","color":"Blue"})'
              rows={3}
              value={variantForm.optionsText}
              onChange={(event) =>
                setVariantForm((prev) => ({ ...prev, optionsText: event.target.value }))
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                name="priceDelta"
                type="number"
                step="0.01"
                placeholder="Price delta"
                value={variantForm.priceDelta}
                onChange={(event) =>
                  setVariantForm((prev) => ({ ...prev, priceDelta: event.target.value }))
                }
              />
              <FormInput
                name="stockQty"
                type="number"
                min={0}
                placeholder="Variant stock"
                value={variantForm.stockQty}
                onChange={(event) =>
                  setVariantForm((prev) => ({ ...prev, stockQty: event.target.value }))
                }
              />
            </div>
            <FormInput
              name="sku"
              placeholder="SKU (optional)"
              value={variantForm.sku}
              onChange={(event) => setVariantForm((prev) => ({ ...prev, sku: event.target.value }))}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-mn-ink">
              <input
                type="checkbox"
                checked={variantForm.isDefault}
                onChange={(event) =>
                  setVariantForm((prev) => ({ ...prev, isDefault: event.target.checked }))
                }
                className="rounded border-border text-mn-teal focus:ring-mn-teal"
              />
              Set as default variant
            </label>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary btn-sm">
                {editingVariantId ? 'Update variant' : 'Create variant'}
              </button>
              {editingVariantId && (
                <button type="button" className="btn btn-outline btn-sm" onClick={resetVariantEditor}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
