import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactionStorage } from '../utils/storage';
import { backupService } from '../utils/backup';
import { settingsStorage, CURRENCIES, qrisStorage } from '../utils/settings';
import { Capacitor } from '@capacitor/core';
import BlockchainWallet from '../plugins/BlockchainWalletPlugin';
import {
  Store,
  ShoppingCart,
  Package,
  History,
  CreditCard,
  TrendingUp,
  LogOut,
  ChevronRight,
  Wallet,
  BarChart3,
  X,
  CloudUpload,
  CloudDownload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Settings,
  DollarSign,
  ChevronDown,
  Trash2,
  AlertTriangle,
  QrCode,
  ImagePlus,
  Smartphone,
  ExternalLink,
  Coins
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Settings modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'backup' | 'currency' | 'qris' | 'wallet' | 'reset'>('backup');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Currency settings
  const [selectedCurrency, setSelectedCurrency] = useState(settingsStorage.getSettings().currency);
  const [showCurrencyList, setShowCurrencyList] = useState(false);

  // QRIS settings
  const [qrisImage, setQrisImage] = useState<string | null>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  // Wallet settings
  const [isOpeningWallet, setIsOpeningWallet] = useState(false);
  const [walletStatus, setWalletStatus] = useState<{
    tezos: { connected: boolean; address: string };
    sui: { connected: boolean; address: string };
  }>({
    tezos: { connected: false, address: '' },
    sui: { connected: false, address: '' }
  });

  useEffect(() => {
    loadDashboardData();
    loadQrisImage();
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const tezosStatus = await BlockchainWallet.getConnectionStatus({ network: 'tezos' });
      const suiStatus = await BlockchainWallet.getConnectionStatus({ network: 'sui' });
      setWalletStatus({
        tezos: { connected: tezosStatus.connected, address: tezosStatus.address },
        sui: { connected: suiStatus.connected, address: suiStatus.address }
      });
    } catch (error) {
      console.log('Wallet status check failed:', error);
    }
  };

  const handleOpenWallet = async (network: 'tezos' | 'sui') => {
    if (!Capacitor.isNativePlatform()) {
      alert('Wallet feature is only available in the mobile app');
      return;
    }
    setIsOpeningWallet(true);
    try {
      await BlockchainWallet.openWalletScreen({ network });
      // Refresh status when modal closes
      setTimeout(() => {
        checkWalletStatus();
        setIsOpeningWallet(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to open wallet:', error);
      setIsOpeningWallet(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const total = await transactionStorage.getTodayTotal();
      const transactions = await transactionStorage.getTodayTransactions();
      setTodayTotal(total);
      setTodayCount(transactions.length);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQrisImage = () => {
    const savedImage = qrisStorage.getQrisImage();
    if (savedImage) {
      setQrisImage(savedImage);
    }
  };

  const handleQrisUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      qrisStorage.saveQrisImage(base64);
      setQrisImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQris = () => {
    if (confirm('Remove QRIS image?')) {
      qrisStorage.removeQrisImage();
      setQrisImage(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupMessage(null);

    try {
      const result = await backupService.backupToGoogleDrive();
      setBackupMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
    } catch (error) {
      setBackupMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Backup failed',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('This will replace all current data with the backup. Continue?')) {
      return;
    }

    setIsRestoring(true);
    setBackupMessage(null);

    try {
      const result = await backupService.restoreFromGoogleDrive();
      setBackupMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });

      if (result.success) {
        // Reload dashboard data after restore
        await loadDashboardData();
      }
    } catch (error) {
      setBackupMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Restore failed',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    settingsStorage.setCurrency(currencyCode);
    setSelectedCurrency(currencyCode);
    setShowCurrencyList(false);
    // Force re-render to update currency display
    loadDashboardData();
  };

  const handleResetData = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL your products and transactions. This cannot be undone. Are you sure?')) {
      return;
    }

    // Second confirmation
    if (!confirm('This is your LAST CHANCE. All data will be lost forever. Continue?')) {
      return;
    }

    setIsResetting(true);
    setBackupMessage(null);

    try {
      // Clear all data from localStorage
      localStorage.removeItem('credpos_products');
      localStorage.removeItem('credpos_transactions');

      // Reload dashboard data
      setTodayTotal(0);
      setTodayCount(0);

      setBackupMessage({
        type: 'success',
        text: 'All data has been reset successfully!',
      });
    } catch (error) {
      setBackupMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Reset failed',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return settingsStorage.formatCurrency(amount);
  };

  const getCurrentCurrency = () => {
    return CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];
  };

  const menuItems = [
    {
      id: 'cashier',
      icon: ShoppingCart,
      label: 'Cashier (POS)',
      description: 'Start new transaction',
      color: 'bg-[#2C7DF7]',
      shadowColor: 'shadow-blue-500/30',
      route: '/cashier',
    },
    {
      id: 'products',
      icon: Package,
      label: 'Add Products',
      description: 'Manage products',
      color: 'bg-[#10B981]',
      shadowColor: 'shadow-green-500/30',
      route: '/products',
    },
    {
      id: 'history',
      icon: History,
      label: 'History',
      description: 'View transactions',
      color: 'bg-purple-500',
      shadowColor: 'shadow-purple-500/30',
      route: '/history',
    },
    {
      id: 'settlement',
      icon: CreditCard,
      label: 'Settlement',
      description: 'Daily recap',
      color: 'bg-orange-500',
      shadowColor: 'shadow-orange-500/30',
      route: '/settlement',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0F172A] pt-12 pb-24 px-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#2C7DF7] to-[#1E5FC7] rounded-xl flex items-center justify-center relative">
              <Store className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#10B981] rounded-full flex items-center justify-center">
                <Settings className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">{user?.businessName || 'CredPOS'}</h1>
              <p className="text-gray-400 text-sm">{user?.ownerName}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Today Stats Card */}
        <div className="bg-gradient-to-br from-[#2C7DF7] to-[#1E5FC7] rounded-2xl p-5 shadow-xl shadow-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm font-medium">Today's Revenue</span>
            </div>
            <div className="bg-white/20 px-2.5 py-1 rounded-full">
              <span className="text-xs text-white font-medium">Live</span>
            </div>
          </div>

          {isLoading ? (
            <div className="h-10 bg-white/20 rounded-lg animate-pulse"></div>
          ) : (
            <h2 className="text-3xl font-bold text-white mb-1">
              {formatCurrency(todayTotal)}
            </h2>
          )}

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Transactions</p>
                <p className="text-white font-semibold">{todayCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Average</p>
                <p className="text-white font-semibold">
                  {todayCount > 0 ? formatCurrency(todayTotal / todayCount) : getCurrentCurrency().symbol + '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-6 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="text-[#0F172A] font-semibold mb-4 px-1">Main Menu</h3>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-left transition-all group"
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-3 shadow-lg ${item.shadowColor}`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-[#0F172A] mb-0.5">{item.label}</h4>
                <p className="text-xs text-gray-500">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mt-4 mb-6">
          <h3 className="text-[#0F172A] font-semibold mb-3 px-1">Quick Actions</h3>

          <button
            onClick={() => navigate('/cashier')}
            className="w-full flex items-center justify-between bg-gradient-to-r from-[#10B981] to-[#059669] rounded-xl p-4 shadow-lg shadow-green-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-white">Start Cashier</h4>
                <p className="text-xs text-white/80">Fast & easy transaction</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Credit Score Banner */}
      <div className="px-6 pb-8">
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#2C7DF7] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Credit Score Ready</h4>
              <p className="text-xs text-gray-400">Blockchain Integration</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Your sales data is recorded and ready for credit assessment. The more consistent, the higher your score!
          </p>
          <div className="mt-4 flex gap-2">
            <div className="bg-[#10B981]/20 px-3 py-1.5 rounded-full">
              <span className="text-xs text-[#10B981] font-medium">✓ Data Encrypted</span>
            </div>
            <div className="bg-[#2C7DF7]/20 px-3 py-1.5 rounded-full">
              <span className="text-xs text-[#2C7DF7] font-medium">✓ Tezos Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2C7DF7] to-[#1E5FC7] rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Settings</h2>
                  <p className="text-sm text-gray-500">{user?.businessName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setBackupMessage(null);
                  setShowCurrencyList(false);
                }}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Tab Buttons - 2 Rows */}
            <div className="mb-6 space-y-2">
              {/* Row 1: Backup, Currency, QRIS */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('backup')}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'backup'
                    ? 'bg-[#2C7DF7] text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Cloud className="w-4 h-4" />
                    <span>Backup</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('currency')}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'currency'
                    ? 'bg-[#2C7DF7] text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Currency</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('qris')}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'qris'
                    ? 'bg-[#10B981] text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>QRIS</span>
                  </div>
                </button>
              </div>
              {/* Row 2: Wallet, Reset */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'wallet'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Coins className="w-4 h-4" />
                    <span>Wallet</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('reset')}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'reset'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    <span>Reset</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Backup Tab */}
            {activeTab === 'backup' && (
              <>
                {/* User Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-1">Signed in as</p>
                  <p className="font-semibold text-[#0F172A]">{user?.email}</p>
                </div>

                {/* Status Message */}
                {backupMessage && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${backupMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    {backupMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <p className={`text-sm ${backupMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                      {backupMessage.text}
                    </p>
                  </div>
                )}

                {/* Backup Button */}
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp || isRestoring}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#2C7DF7] bg-[#2C7DF7]/5 hover:bg-[#2C7DF7]/10 transition-colors mb-3 disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-[#2C7DF7] rounded-xl flex items-center justify-center">
                    {isBackingUp ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <CloudUpload className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-[#0F172A]">Backup to Google Drive</h4>
                    <p className="text-sm text-gray-500">
                      {isBackingUp ? 'Uploading...' : 'Save your data to cloud'}
                    </p>
                  </div>
                </button>

                {/* Restore Button */}
                <button
                  onClick={handleRestore}
                  disabled={isBackingUp || isRestoring}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#10B981] bg-[#10B981]/5 hover:bg-[#10B981]/10 transition-colors disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-[#10B981] rounded-xl flex items-center justify-center">
                    {isRestoring ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <CloudDownload className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-[#0F172A]">Restore from Google Drive</h4>
                    <p className="text-sm text-gray-500">
                      {isRestoring ? 'Downloading...' : 'Load data from cloud backup'}
                    </p>
                  </div>
                </button>

                {/* Info */}
                <p className="text-xs text-gray-400 text-center mt-4">
                  Your data is securely stored in your personal Google Drive account
                </p>
              </>
            )}

            {/* Currency Tab */}
            {activeTab === 'currency' && (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-3">Select your preferred currency</p>

                  {/* Current Currency Display */}
                  <button
                    onClick={() => setShowCurrencyList(!showCurrencyList)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#2C7DF7] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2C7DF7] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{getCurrentCurrency().symbol}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#0F172A]">{getCurrentCurrency().name}</p>
                        <p className="text-sm text-gray-500">{getCurrentCurrency().code}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCurrencyList ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Currency List */}
                {showCurrencyList && (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {CURRENCIES.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => handleCurrencyChange(currency.code)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedCurrency === currency.code
                          ? 'bg-[#2C7DF7]/10 border-2 border-[#2C7DF7]'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCurrency === currency.code ? 'bg-[#2C7DF7]' : 'bg-gray-200'
                          }`}>
                          <span className={`font-bold text-sm ${selectedCurrency === currency.code ? 'text-white' : 'text-gray-600'
                            }`}>{currency.symbol}</span>
                        </div>
                        <div className="text-left flex-1">
                          <p className={`font-medium ${selectedCurrency === currency.code ? 'text-[#2C7DF7]' : 'text-[#0F172A]'
                            }`}>{currency.name}</p>
                          <p className="text-xs text-gray-500">{currency.code}</p>
                        </div>
                        {selectedCurrency === currency.code && (
                          <CheckCircle2 className="w-5 h-5 text-[#2C7DF7]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Currency Preview */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Preview</p>
                  <p className="text-2xl font-bold text-[#0F172A]">
                    {formatCurrency(12345)}
                  </p>
                </div>
              </>
            )}

            {/* QRIS Tab */}
            {activeTab === 'qris' && (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="w-5 h-5 text-[#10B981]" />
                    <h3 className="font-semibold text-[#0F172A]">QRIS Payment QR Code</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload your QRIS QR code image. It will be displayed when customers select QRIS payment.
                  </p>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={qrisInputRef}
                  onChange={handleQrisUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* QRIS Image Preview or Upload Button */}
                {qrisImage ? (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-3 text-center">Your QRIS Code</p>
                      <div className="flex justify-center">
                        <img
                          src={qrisImage}
                          alt="QRIS QR Code"
                          className="max-w-full max-h-64 rounded-xl border-2 border-gray-200"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => qrisInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#2C7DF7] text-white font-medium"
                      >
                        <ImagePlus className="w-5 h-5" />
                        <span>Change Image</span>
                      </button>
                      <button
                        onClick={handleRemoveQris}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-100 text-red-600 font-medium"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => qrisInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#10B981] hover:bg-[#10B981]/5 transition-colors"
                  >
                    <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center">
                      <ImagePlus className="w-8 h-8 text-[#10B981]" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-[#0F172A]">Upload QRIS Image</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  </button>
                )}

                {/* Info */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Get your QRIS image from your payment provider (GoPay, OVO, DANA, etc.) or your bank's merchant dashboard.
                  </p>
                </div>
              </>
            )}

            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-[#0F172A]">Blockchain Wallet</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Connect your wallet to sign your credit score on blockchain (Testnet only - no real money).
                  </p>
                </div>

                {/* Tezos Wallet */}
                <button
                  onClick={() => handleOpenWallet('tezos')}
                  disabled={isOpeningWallet}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#2C7DF7] bg-[#2C7DF7]/5 hover:bg-[#2C7DF7]/10 transition-colors mb-3 disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-[#2C7DF7] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">ꜩ</span>
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-[#0F172A]">Tezos (Ghostnet)</h4>
                    <p className="text-sm text-gray-500">
                      {walletStatus.tezos.connected
                        ? `Connected: ${walletStatus.tezos.address.slice(0, 8)}...${walletStatus.tezos.address.slice(-6)}`
                        : 'Tap to connect wallet'}
                    </p>
                  </div>
                  {walletStatus.tezos.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Sui Wallet */}
                <button
                  onClick={() => handleOpenWallet('sui')}
                  disabled={isOpeningWallet}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#4DA2FF] bg-[#4DA2FF]/5 hover:bg-[#4DA2FF]/10 transition-colors mb-3 disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4DA2FF] to-[#6FBFFF] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-[#0F172A]">Sui (Devnet)</h4>
                    <p className="text-sm text-gray-500">
                      {walletStatus.sui.connected
                        ? `Connected: ${walletStatus.sui.address.slice(0, 8)}...${walletStatus.sui.address.slice(-6)}`
                        : 'Tap to connect wallet'}
                    </p>
                  </div>
                  {walletStatus.sui.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Credit Score Info */}
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h4 className="font-semibold text-purple-700 mb-2">💳 Credit Score Signing</h4>
                  <p className="text-sm text-purple-600">
                    Your sales data builds your credit score. Connect your wallet to cryptographically sign your score on blockchain for verification.
                  </p>
                </div>

                {/* Testnet Warning */}
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs text-yellow-700 text-center">
                    ⚠️ This uses <strong>testnet only</strong> - no real cryptocurrency involved
                  </p>
                </div>
              </>
            )}

            {/* Reset Tab */}
            {activeTab === 'reset' && (
              <>
                {/* Warning Banner */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700 mb-1">Danger Zone</h4>
                      <p className="text-sm text-red-600">
                        Resetting will permanently delete all your products and transactions. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                {backupMessage && (
                  <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${backupMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    {backupMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <p className={`text-sm ${backupMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                      {backupMessage.text}
                    </p>
                  </div>
                )}

                {/* What will be deleted */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">This will delete:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4 text-red-500" />
                      <span>All products</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <History className="w-4 h-4 text-red-500" />
                      <span>All transactions</span>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Before resetting, consider backing up your data to Google Drive first. You can restore it later if needed.
                  </p>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    {isResetting ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Trash2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-semibold text-white">Reset All Data</h4>
                    <p className="text-sm text-white/80">
                      {isResetting ? 'Resetting...' : 'Delete all products and transactions'}
                    </p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
