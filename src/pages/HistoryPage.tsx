import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionStorage } from '../utils/storage';
import { settingsStorage } from '../utils/settings';
import { Transaction } from '../types';
import {
  ArrowLeft,
  Loader2,
  Receipt,
  Clock,
  Wallet,
  Smartphone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await transactionStorage.getAll();
      setTransactions(data);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return settingsStorage.formatCurrency(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="w-4 h-4" />;
      case 'qris':
        return <Smartphone className="w-4 h-4" />;
      case 'transfer':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'qris':
        return 'QRIS';
      case 'transfer':
        return 'Transfer';
      default:
        return method;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    switch (filter) {
      case 'today':
        return t.timestamp >= todayTimestamp;
      case 'week':
        return t.timestamp >= weekAgo;
      default:
        return true;
    }
  });

  const totalFiltered = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

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
          <h1 className="text-xl font-bold text-white">Transaction History</h1>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'all'
              ? 'bg-[#2C7DF7] text-white'
              : 'bg-white/10 text-gray-400'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'today'
              ? 'bg-[#2C7DF7] text-white'
              : 'bg-white/10 text-gray-400'
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === 'week'
              ? 'bg-[#2C7DF7] text-white'
              : 'bg-white/10 text-gray-400'
              }`}
          >
            7 Days
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-4 -mt-2">
        <div className="bg-gradient-to-r from-[#2C7DF7] to-[#1E5FC7] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total ({filteredTransactions.length} transactions)</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalFiltered)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#2C7DF7] animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No transactions yet</h3>
            <p className="text-gray-500 text-sm">Transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === transaction.id ? null : transaction.id)}
                  className="w-full p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#0F172A]">{formatCurrency(transaction.totalAmount)}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(transaction.timestamp)} • {formatTime(transaction.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${transaction.paymentMethod === 'cash'
                        ? 'bg-green-100 text-green-700'
                        : transaction.paymentMethod === 'qris'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                        }`}>
                        {getPaymentIcon(transaction.paymentMethod)}
                        <span>{getPaymentLabel(transaction.paymentMethod)}</span>
                      </div>
                      {expandedId === transaction.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Items */}
                {expandedId === transaction.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">ITEM DETAILS</h4>
                    <div className="space-y-2">
                      {transaction.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-medium">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-700">{item.product.name}</span>
                          </div>
                          <span className="text-gray-600">{formatCurrency(item.product.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A]">Total</span>
                      <span className="font-bold text-[#10B981]">{formatCurrency(transaction.totalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
