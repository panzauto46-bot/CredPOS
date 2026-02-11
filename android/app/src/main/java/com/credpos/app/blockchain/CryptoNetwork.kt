package com.credpos.app.blockchain

/**
 * Sealed class representing supported blockchain networks.
 * Strictly uses Testnet/Ghostnet for zero-cost development.
 */
sealed class CryptoNetwork(
    val name: String,
    val displayName: String,
    val networkType: NetworkType,
    val explorerUrl: String,
    val iconResName: String
) {
    
    object Tezos : CryptoNetwork(
        name = "tezos",
        displayName = "Tezos",
        networkType = NetworkType.GHOSTNET,
        explorerUrl = "https://ghostnet.tzkt.io/",
        iconResName = "ic_tezos"
    ) {
        // Tezos Ghostnet RPC endpoint
        const val RPC_URL = "https://ghostnet.ecadinfra.com"
        const val BEACON_APP_NAME = "CredPOS"
        const val BEACON_APP_URL = "https://credpos.app"
        const val BEACON_APP_ICON = "https://credpos.app/icon.png"
    }
    
    object Sui : CryptoNetwork(
        name = "sui",
        displayName = "Sui",
        networkType = NetworkType.DEVNET,
        explorerUrl = "https://suiexplorer.com/?network=devnet/",
        iconResName = "ic_sui"
    ) {
        // Sui Devnet RPC endpoint
        const val RPC_URL = "https://fullnode.devnet.sui.io:443"
        const val WALLET_DEEP_LINK_PREFIX = "sui://"
        const val WALLET_PACKAGE_NAME = "com.mystenlabs.suiwallet"
    }
    
    companion object {
        fun all(): List<CryptoNetwork> = listOf(Tezos, Sui)
        
        fun fromName(name: String): CryptoNetwork? {
            return when (name.lowercase()) {
                "tezos" -> Tezos
                "sui" -> Sui
                else -> null
            }
        }
    }
}

/**
 * Network type enum - Strictly NO Mainnet allowed
 */
enum class NetworkType(val displayName: String) {
    GHOSTNET("Ghostnet (Testnet)"),  // Tezos testnet
    DEVNET("Devnet"),                 // Sui devnet
    TESTNET("Testnet");               // Generic testnet
    
    fun isTestnet(): Boolean = true // All are testnets
}
