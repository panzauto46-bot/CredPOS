# Multi-Chain Wallet Integration Guide

## Overview

CredPOS now supports multi-chain connectivity for **Tezos (Ghostnet)** and **Sui (Devnet)** blockchains. This implementation uses a **Network Switcher** architecture that allows users to seamlessly switch between chains and connect their wallets.

> ⚠️ **IMPORTANT**: This implementation uses **Testnet/Ghostnet only** - Zero real funds are at risk.

## Architecture

### Core Components

```
com.credpos.app.blockchain/
├── CryptoNetwork.kt          # Sealed class for network definitions
├── BlockchainRepository.kt   # Interface for wallet operations
├── WalletViewModel.kt        # ViewModel for state management
├── tezos/
│   └── TezosRepository.kt    # Tezos Ghostnet implementation
├── sui/
│   └── SuiRepository.kt      # Sui Devnet implementation
└── plugin/
    └── BlockchainWalletPlugin.kt  # Capacitor bridge plugin

com.credpos.app.ui/
├── WalletActivity.kt         # Compose Activity
├── theme/
│   ├── Theme.kt              # Color schemes
│   └── Type.kt               # Typography
├── components/
│   ├── NetworkSwitcher.kt    # Network dropdown
│   └── WalletConnectionCard.kt  # Connection UI
└── screens/
    └── WalletScreen.kt       # Main wallet screen
```

### Sealed Class: CryptoNetwork

```kotlin
sealed class CryptoNetwork(
    val name: String,
    val displayName: String,
    val networkType: NetworkType,
    val explorerUrl: String,
    val iconResName: String
) {
    object Tezos : CryptoNetwork(...)  // Ghostnet
    object Sui : CryptoNetwork(...)    // Devnet
}
```

### Interface: BlockchainRepository

```kotlin
interface BlockchainRepository {
    val connectionState: StateFlow<WalletConnectionState>
    val network: CryptoNetwork
    
    suspend fun connectWallet(
        onSuccess: (address: String) -> Unit,
        onError: (String) -> Unit
    )
    
    suspend fun disconnectWallet()
    
    suspend fun signCreditScore(score: String): SigningResult
    
    fun isWalletInstalled(): Boolean
    
    fun getConnectedAddress(): String?
    
    suspend fun verifyConnection(): Boolean
}
```

## Supported Wallets

### Tezos (Ghostnet)
- **Temple Wallet** (io.temple.wallet)
- **AirGap Wallet** (com.airgap.wallet)
- **Kukai Wallet** (com.kukai.wallet)
- **Autonomy Wallet** (io.autonomy.wallet)

### Sui (Devnet)
- **Sui Wallet** (com.mystenlabs.suiwallet)
- **Suiet Wallet** (io.suiet.app)
- **Ethos Wallet** (app.ethos.wallet)
- **Martian Wallet** (com.martianwallet.sui)

## Usage from Web App (TypeScript)

### Import the Plugin

```typescript
import BlockchainWallet from './plugins/BlockchainWalletPlugin';
```

### Open Wallet Screen

```typescript
// For Tezos
const result = await BlockchainWallet.openWalletScreen({ network: 'tezos' });

// For Sui
const result = await BlockchainWallet.openWalletScreen({ network: 'sui' });
```

### Check Connection Status

```typescript
const status = await BlockchainWallet.getConnectionStatus({ network: 'tezos' });
console.log('Connected:', status.connected);
console.log('Address:', status.address);
```

### Disconnect Wallet

```typescript
await BlockchainWallet.disconnectWallet({ network: 'tezos' });
```

## UI Components

### NetworkSwitcher

A dropdown component in the top bar that allows switching between Tezos and Sui networks.

```kotlin
NetworkSwitcher(
    selectedNetwork = uiState.selectedNetwork,
    onNetworkSelected = { viewModel.selectNetwork(it) }
)
```

### WalletConnectionCard

Shows connection status and handles connect/disconnect/sign actions.

```kotlin
WalletConnectionCard(
    network = uiState.selectedNetwork,
    connectionState = uiState.connectionState,
    isLoading = uiState.isLoading,
    onConnectClick = { viewModel.connectWallet() },
    onDisconnectClick = { viewModel.disconnectWallet() },
    onSignClick = { viewModel.signCreditScore("750") }
)
```

### VerifiedBadge

Shows a "Verified" badge with network-specific styling when connected.

## Error Handling

The implementation handles these scenarios:

1. **Wallet not installed**: Shows a friendly error message suggesting which wallet apps to install.
2. **Connection failed**: Displays error with retry option.
3. **Signing cancelled**: Shows cancellation message.
4. **Network errors**: Gracefully handles RPC failures.

```kotlin
when (connectionState) {
    is WalletConnectionState.Disconnected -> // Show connect button
    is WalletConnectionState.Connecting -> // Show loading
    is WalletConnectionState.Connected -> // Show address & actions
    is WalletConnectionState.Error -> // Show error with retry
}
```

## Network Configuration

### Tezos Ghostnet
- **RPC URL**: `https://ghostnet.ecadinfra.com`
- **Explorer**: `https://ghostnet.tzkt.io/`
- **Beacon Protocol**: TZIP-10 compliant

### Sui Devnet
- **RPC URL**: `https://fullnode.devnet.sui.io:443`
- **Explorer**: `https://suiexplorer.com/?network=devnet/`
- **Protocol**: Sui Wallet Standard

## Building the App

```bash
# Navigate to android directory
cd android

# Build debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug
```

## Testing

1. Install a compatible wallet app on your device
2. Ensure the wallet is configured for the testnet
3. Open CredPOS and tap the wallet icon
4. Select the network (Tezos or Sui)
5. Tap "Connect Wallet"
6. Approve the connection in the wallet app
7. Sign a credit score to test the signing flow

## Security Notes

- All connections use testnet only (zero financial risk)
- Session data is stored in app-private SharedPreferences
- Deep links are scoped to the app's custom scheme
- Package queries are limited to known wallet apps

## Future Enhancements

- [ ] Real Beacon SDK integration for production
- [ ] Sui Wallet Adapter SDK integration
- [ ] Additional chain support (Polygon, Arbitrum)
- [ ] Transaction history display
- [ ] NFT badge minting for verified scores
