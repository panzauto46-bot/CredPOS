// Model Product - sama seperti Product.java
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: 'food' | 'drink' | 'snacks';
  imageUrl?: string;
  createdAt: number;
}

// Model Transaction - sama seperti Transaction.java
export interface Transaction {
  id: string;
  timestamp: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'qris' | 'transfer';
  items: CartItem[];
  userId: string;
}

// Model CartItem
export interface CartItem {
  product: Product;
  quantity: number;
}

// Model User
export interface User {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  createdAt: number;
  photoURL?: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
