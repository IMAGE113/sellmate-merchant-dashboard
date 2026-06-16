import { useEffect, useState } from 'react';
import { apiClient, Product } from '@/lib/api';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(''); 

  useEffect(() => {
    fetchProducts();
  }, [page, limit]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getProducts(page, limit);
      
      if (Array.isArray(response)) {
        setProducts(response);
        setTotal(response.length);
      } else if (response && Array.isArray((response as any).products)) {
        setProducts((response as any).products);
        setTotal((response as any).total || (response as any).products.length);
      } else {
        setProducts([]);
        setTotal(0);
      }
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Failed to load products'
        : 'An error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
      setProducts([]); 
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter((product) => {
    if (!product) return false;
    const matchesSearch = (product.product_name || "").toLowerCase().includes(searchTerm.toLowerCase());
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
            <Button onClick={fetchProducts} variant="outline" disabled={isLoading}>
              Refresh
            </Button>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[425px] bg-background border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Add New Product</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">
                      Product Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Enter product name (e.g. Espresso)"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="price" className="text-sm font-medium text-foreground">
                      Price ($)
                    </label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="quantity" className="text-sm font-medium text-foreground">
                      Quantity
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={newProductQuantity}
                      onChange={(e) => setNewProductQuantity(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    disabled={!newProductName || !newProductPrice || !newProductQuantity} 
                    onClick={async () => {
                      try {
                        await apiClient.createProduct({
                          product_name: newProductName,
                          price: Number(newProductPrice),
                          quantity: Number(newProductQuantity),
                          status: 'active'
                        });

                        toast.success("Product added successfully!");
                        setIsAddModalOpen(false); 
                        fetchProducts(); 
                        
                        setNewProductName(''); 
                        setNewProductPrice('');
                        setNewProductQuantity('');
                      } catch (err) {
                        console.error("Add product error:", err);
                        toast.error(axios.isAxiosError(err) && err.response?.data?.message 
                          ? err.response.data.message 
                          : "Failed to add product"
                        );
                      }
                    }}
                  >
                    Save Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={fetchProducts} variant="outline" size="sm" className="mt-2">
              Try Again
            </Button>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Product Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
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

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Created Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product?.product_id || Math.random().toString()} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{product?.product_name || 'Unknown Product'}</td>
                      <td className="py-3 px-4 text-foreground">${(product?.price ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-foreground">{(product?.quantity ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product?.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {product?.status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {product?.created_date ? new Date(product.created_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled title="Feature coming soon">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" disabled title="Feature coming soon">
                            Delete
                          </Button>
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

        {/* Pagination */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} products
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-3 text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}