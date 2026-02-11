package com.credpos.app.blockchain

import kotlinx.coroutines.flow.StateFlow

/**
 * Connection state for wallet connections
 */
sealed class WalletConnectionState {
    object Disconnected : WalletConnectionState()
    object Connecting : WalletConnectionState()
    data class Connected(
        val address: String,
        val network: CryptoNetwork,
        val publicKey: String? = null
    ) : WalletConnectionState()
    data class Error(val message: String) : WalletConnectionState()
}

/**
 * Result wrapper for signing operations
 */
sealed class SigningResult {
    data class Success(val signature: String, val hash: String? = null) : SigningResult()
    data class Error(val message: String) : SigningResult()
    object Cancelled : SigningResult()
}

/**
 * Generic interface for blockchain wallet operations.
 * Implementations must handle wallet not installed scenarios gracefully.
 */
interface BlockchainRepository {
    
    /**
     * Current connection state as a StateFlow for reactive UI updates
     */
    val connectionState: StateFlow<WalletConnectionState>
    
    /**
     * The network this repository operates on
     */
    val network: CryptoNetwork
    
    /**
     * Connect to wallet for the specific blockchain.
     * Must handle cases where wallet app is not installed.
     * 
     * @param onSuccess Callback with the connected wallet address
     * @param onError Callback with error message if connection fails
     */
    suspend fun connectWallet(
        onSuccess: (address: String) -> Unit,
        onError: (String) -> Unit
    )
    
    /**
     * Disconnect from the current wallet session.
     * Should clean up any session data and reset connection state.
     */
    suspend fun disconnectWallet()
    
    /**
     * Trigger a signing request to the connected wallet.
     * This will prompt the user in their wallet app to sign the credit score.
     * 
     * @param score The credit score string to sign
     * @return SigningResult indicating success, error, or user cancellation
     */
    suspend fun signCreditScore(score: String): SigningResult
    
    /**
     * Check if the required wallet app is installed on the device.
     * @return true if wallet is available, false otherwise
     */
    fun isWalletInstalled(): Boolean
    
    /**
     * Get the connected wallet address, if any.
     * @return The wallet address or null if not connected
     */
    fun getConnectedAddress(): String?
    
    /**
     * Verify if the current session is still valid.
     * @return true if connected and session is active
     */
    suspend fun verifyConnection(): Boolean
}
