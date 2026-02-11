import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productStorage } from '../utils/storage';
import { settingsStorage } from '../utils/settings';
import { Product } from '../types';
import {
  ArrowLeft,
  Plus,
  Package,
  Loader2,
  Trash2,
  Edit2,
  DollarSign,
  Boxes,
  Search,
  X,
  UtensilsCrossed,
  Coffee,
  Cookie
} from 'lucide-react';

const CATEGORIES = [
  { id: 'food', name: 'Food', icon: UtensilsCrossed, color: 'bg-orange-500' },
  { id: 'drink', name: 'Drink', icon: Coffee, color: 'bg-blue-500' },
  { id: 'snacks', name: 'Snacks', icon: Cookie, color: 'bg-amber-500' },
] as const;

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState<'food' | 'drink' | 'snacks'>('food');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productStorage.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !price || !stock) {
      setError('All fields are required');
      return;
    }

    setIsSaving(true);
    try {
      await productStorage.add({
        name: name.trim(),
        price: parseInt(price),
        stock: parseInt(stock),
        category,
      });
      setShowAddModal(false);
      resetForm();
      loadProducts();
    } catch (err) {
      setError('Failed to add product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setError('');
    setIsSaving(true);

    try {
      await productStorage.update(editingProduct.id, {
        name: name.trim(),
        price: parseInt(price),
        stock: parseInt(stock),
        category,
      });
      setShowEditModal(false);
      resetForm();
      loadProducts();
    } catch (err) {
      setError('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await productStorage.delete(id);
        loadProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategory(product.category || 'food');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setStock('');
    setCategory('food');
    setError('');
    setEditingProduct(null);
  };

  const formatCurrency = (amount: number) => {
    return settingsStorage.formatCurrency(amount);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0F172A] pt-12 pb-6 px-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white/10 rounded-xl text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Manage Products</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2C7DF7]"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#2C7DF7] animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? 'Product not found' : 'No products yet'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery ? 'Try another keyword' : 'Add your first product'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const categoryInfo = CATEGORIES.find(c => c.id === product.category) || CATEGORIES[0];
              const CategoryIcon = categoryInfo.icon;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryInfo.color}`}>
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#0F172A]">{product.name}</h4>
                        <p className="text-[#2C7DF7] font-bold">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.stock > 10
                      ? 'bg-green-100 text-green-700'
                      : product.stock > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      Stock: {product.stock}
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryInfo.id === 'food' ? 'bg-orange-100 text-orange-700' :
                      categoryInfo.id === 'drink' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                      {categoryInfo.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#2C7DF7] rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:bg-[#1E6CE0] transition-colors"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">Add Product</h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Latte Coffee"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial Stock</label>
                <div className="relative">
                  <Boxes className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${category === cat.id
                          ? 'border-[#2C7DF7] bg-[#2C7DF7]/5'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category === cat.id ? cat.color : 'bg-gray-100'
                          }`}>
                          <Icon className={`w-5 h-5 ${category === cat.id ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <span className={`text-sm font-medium ${category === cat.id ? 'text-[#2C7DF7]' : 'text-gray-600'
                          }`}>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#2C7DF7] text-white font-semibold py-4 rounded-xl hover:bg-[#1E6CE0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Product'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">Edit Product</h2>
              <button
                onClick={() => { setShowEditModal(false); resetForm(); }}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
                <div className="relative">
                  <Boxes className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C7DF7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${category === cat.id
                          ? 'border-[#2C7DF7] bg-[#2C7DF7]/5'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category === cat.id ? cat.color : 'bg-gray-100'
                          }`}>
                          <Icon className={`w-5 h-5 ${category === cat.id ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <span className={`text-sm font-medium ${category === cat.id ? 'text-[#2C7DF7]' : 'text-gray-600'
                          }`}>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#10B981] text-white font-semibold py-4 rounded-xl hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Update Product'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
