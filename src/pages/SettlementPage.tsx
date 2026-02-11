import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionStorage } from '../utils/storage';
import { settingsStorage } from '../utils/settings';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  Wallet,
  Smartphone,
  CreditCard,
  Calendar,
  CheckCircle2,
  PieChart
} from 'lucide-react';

export const SettlementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  useEffect(() => {
    loadTodayTransactions();
  }, []);

  const loadTodayTransactions = async () => {
    try {
      const data = await transactionStorage.getTodayTransactions();
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

  const getTotalByMethod = (method: 'cash' | 'qris' | 'transfer') => {
    return transactions
      .filter(t => t.paymentMethod === method)
      .reduce((sum, t) => sum + t.totalAmount, 0);
  };

  const getCountByMethod = (method: 'cash' | 'qris' | 'transfer') => {
    return transactions.filter(t => t.paymentMethod === method).length;
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  const handleExport = () => {
    // Simulate export
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 2000);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-[#0F172A] pt-12 pb-20 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-white/10 rounded-xl text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Settlement</h1>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#2C7DF7] rounded-xl text-white text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{today}</span>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="px-4 -mt-14">
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm mb-1">Today's Total Revenue</p>
            {isLoading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-48 mx-auto"></div>
            ) : (
              <h2 className="text-3xl font-bold text-[#0F172A]">{formatCurrency(totalAmount)}</h2>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-8 h-8 bg-[#10B981]/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-sm text-gray-600">{totalTransactions} transactions</span>
            </div>
          </div>

          {/* Visual Bar */}
          {totalAmount > 0 && (
            <div className="mb-6">
              <div className="flex rounded-full overflow-hidden h-3">
                <div
                  className="bg-green-500"
                  style={{ width: `${(getTotalByMethod('cash') / totalAmount) * 100}%` }}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${(getTotalByMethod('qris') / totalAmount) * 100}%` }}
                />
                <div
                  className="bg-purple-500"
                  style={{ width: `${(getTotalByMethod('transfer') / totalAmount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Payment Method Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A]">Cash</h4>
                  <p className="text-xs text-gray-500">{getCountByMethod('cash')} transactions</p>
                </div>
              </div>
              <span className="font-bold text-green-600">{formatCurrency(getTotalByMethod('cash'))}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A]">QRIS</h4>
                  <p className="text-xs text-gray-500">{getCountByMethod('qris')} transactions</p>
                </div>
              </div>
              <span className="font-bold text-blue-600">{formatCurrency(getTotalByMethod('qris'))}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A]">Transfer</h4>
                  <p className="text-xs text-gray-500">{getCountByMethod('transfer')} transactions</p>
                </div>
              </div>
              <span className="font-bold text-purple-600">{formatCurrency(getTotalByMethod('transfer'))}</span>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <h3 className="font-semibold text-[#0F172A] mb-4">Business Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Business Name</span>
              <span className="font-medium text-[#0F172A]">{user?.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Owner</span>
              <span className="font-medium text-[#0F172A]">{user?.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Settlement Date</span>
              <span className="font-medium text-[#0F172A]">{new Date().toLocaleDateString('en-US')}</span>
            </div>
          </div>
        </div>

        {/* Credit Score Card */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#2C7DF7] rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Credit Score Analytics</h4>
              <p className="text-xs text-gray-400">Blockchain Ready Data</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Consistency</p>
              <p className="text-white font-bold text-lg">Good</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Data Collected</p>
              <p className="text-white font-bold text-lg">{totalTransactions} Txn</p>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Your settlement data is encrypted and ready for credit assessment on Tezos blockchain.
          </p>
        </div>
      </div>

      {/* Export Success Toast */}
      {showExportSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce-in z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Data exported successfully!</span>
        </div>
      )}
    </div>
  );
};
