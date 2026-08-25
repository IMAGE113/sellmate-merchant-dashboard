import { useEffect, useState } from 'react';
import { apiClient, Product, ProductInput } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

type ProductForm = ProductInput;

const emptyForm: ProductForm = {
  product_name: '',
  price: 0,
  quantity: 0,
  status: 'active',
  sku: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  useEffect(() => {
    void fetchProducts();
  }, [page, limit]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getProducts(page, limit);
      setProducts(Array.isArray(response?.products) ? response.products : []);
      setTotal(response?.total ?? 0);
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.response?.data?.message || 'Failed to load products'
        : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setForm({
      product_name: product.product_name,
      price: Number(product.price ?? 0),
      quantity: Number(product.quantity ?? 0),
      status: product.status === 'inactive' ? 'inactive' : 'active',
      sku: product.sku ?? '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (!isSaving) setIsFormOpen(false);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.product_name.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!name) {
      toast.error('Product name is required');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Price must be a non-negative number');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error('Inventory quantity must be a non-negative whole number');
      return;
    }

    try {
      setIsSaving(true);
      const payload: ProductInput = {
        product_name: name,
        price,
        quantity,
        status: form.status,
        ...(form.sku?.trim() ? { sku: form.sku.trim() } : {}),
      };
      if (editingProduct) {
        await apiClient.updateProduct(editingProduct.product_id, payload);
        toast.success('Product updated');
      } else {
        await apiClient.createProduct(payload);
        toast.success('Product created');
      }
      setIsFormOpen(false);
      await fetchProducts();
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.response?.data?.message || 'Failed to save product'
        : 'Failed to save product';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete ${product.product_name}?`)) return;
    try {
      await apiClient.deleteProduct(product.product_id);
      toast.success('Product deleted');
      if (products.length === 1 && page > 1) setPage((current) => current - 1);
      else await fetchProducts();
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.response?.data?.message || 'Failed to delete product'
        : 'Failed to delete product';
      toast.error(errorMsg);
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter((product) => {
    if (!product) return false;
    const matchesSearch = (product.product_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <div className="flex gap-2">
            <Button onClick={() => void fetchProducts()} variant="outline" disabled={isLoading || isSaving}>
              Refresh
            </Button>
            <Button onClick={openCreateForm} disabled={isSaving}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => void fetchProducts()} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </Card>
        )}

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Product Name"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(0).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">SKU</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Inventory</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Created Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.product_id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{product.product_name || 'Unknown Product'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.sku || '—'}</td>
                      <td className="py-3 px-4 text-foreground">${Number(product.price ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-foreground">{Number(product.quantity ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {product.status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {product.created_date ? new Date(product.created_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(product)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => void handleDelete(product)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </Card>

        {!isLoading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} products
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-3 text-sm font-medium">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages || page >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <Card className="w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <h2 id="product-form-title" className="text-xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
              <div>
                <label htmlFor="product-name" className="text-sm font-medium">Product name</label>
                <Input id="product-name" value={form.product_name} onChange={(event) => setForm({ ...form, product_name: event.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="text-sm font-medium">Price</label>
                  <Input id="product-price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} required />
                </div>
                <div>
                  <label htmlFor="product-quantity" className="text-sm font-medium">Inventory quantity</label>
                  <Input id="product-quantity" type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} required />
                </div>
              </div>
              <div>
                <label htmlFor="product-sku" className="text-sm font-medium">SKU (optional)</label>
                <Input id="product-sku" value={form.sku ?? ''} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
              </div>
              <div>
                <label htmlFor="product-status" className="text-sm font-medium">Status</label>
                <select id="product-status" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value === 'inactive' ? 'inactive' : 'active' })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Product'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
