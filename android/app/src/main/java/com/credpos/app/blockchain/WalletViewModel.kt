package com.credpos.app.blockchain

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.credpos.app.blockchain.sui.SuiRepository
import com.credpos.app.blockchain.tezos.TezosRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * UI State for the wallet connection feature
 */
data class WalletUiState(
    val selectedNetwork: CryptoNetwork = CryptoNetwork.Tezos,
    val connectionState: WalletConnectionState = WalletConnectionState.Disconnected,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val lastSigningResult: SigningResult? = null
)

/**
 * ViewModel for managing multi-chain wallet connections.
 * Handles network switching between Tezos and Sui.
 */
class WalletViewModel(
    private val context: Context
) : ViewModel() {
    
    private val tezosRepository: BlockchainRepository = TezosRepository(context)
    private val suiRepository: BlockchainRepository = SuiRepository(context)
    
    private val _uiState = MutableStateFlow(WalletUiState())
    val uiState: StateFlow<WalletUiState> = _uiState.asStateFlow()
    
    private var currentRepository: BlockchainRepository = tezosRepository
    
    init {
        // Observe connection state from current repository
        observeConnectionState()
    }
    
    private fun observeConnectionState() {
        viewModelScope.launch {
            currentRepository.connectionState.collect { state ->
                _uiState.value = _uiState.value.copy(
                    connectionState = state,
                    isLoading = state is WalletConnectionState.Connecting
                )
            }
        }
    }
    
    /**
     * Switch to a different blockchain network
     */
    fun selectNetwork(network: CryptoNetwork) {
        if (_uiState.value.selectedNetwork == network) return
        
        viewModelScope.launch {
            // Disconnect from current network if connected
            if (_uiState.value.connectionState is WalletConnectionState.Connected) {
                currentRepository.disconnectWallet()
            }
            
            // Switch repository
            currentRepository = when (network) {
                is CryptoNetwork.Tezos -> tezosRepository
                is CryptoNetwork.Sui -> suiRepository
            }
            
            _uiState.value = _uiState.value.copy(
                selectedNetwork = network,
                connectionState = currentRepository.connectionState.value,
                errorMessage = null,
                successMessage = null
            )
            
            // Re-observe the new repository's connection state
            observeConnectionState()
        }
    }
    
    /**
     * Connect to wallet for the currently selected network
     */
    fun connectWallet() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null,
                successMessage = null
            )
            
            currentRepository.connectWallet(
                onSuccess = { address ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Connected: ${shortenAddress(address)}"
                    )
                },
                onError = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error
                    )
                }
            )
        }
    }
    
    /**
     * Disconnect the current wallet
     */
    fun disconnectWallet() {
        viewModelScope.launch {
            currentRepository.disconnectWallet()
            _uiState.value = _uiState.value.copy(
                successMessage = "Wallet disconnected",
                errorMessage = null
            )
        }
    }
    
    /**
     * Sign a credit score with the connected wallet
     */
    fun signCreditScore(score: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                errorMessage = null
            )
            
            val result = currentRepository.signCreditScore(score)
            
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                lastSigningResult = result,
                successMessage = when (result) {
                    is SigningResult.Success -> "Score signed successfully"
                    is SigningResult.Error -> null
                    SigningResult.Cancelled -> null
                },
                errorMessage = when (result) {
                    is SigningResult.Error -> result.message
                    SigningResult.Cancelled -> "Signing was cancelled"
                    else -> null
                }
            )
        }
    }
    
    /**
     * Check if wallet app is installed for current network
     */
    fun isWalletInstalled(): Boolean = currentRepository.isWalletInstalled()
    
    /**
     * Get the connected address for current network
     */
    fun getConnectedAddress(): String? = currentRepository.getConnectedAddress()
    
    /**
     * Manually set wallet address (for when deep link callback doesn't work)
     */
    fun setAddressManually(address: String) {
        viewModelScope.launch {
            if (address.isBlank()) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Please enter a valid wallet address"
                )
                return@launch
            }
            
            // Validate address format based on network
            val isValidAddress = when (_uiState.value.selectedNetwork) {
                is CryptoNetwork.Tezos -> address.startsWith("tz1") || 
                    address.startsWith("tz2") || 
                    address.startsWith("tz3") ||
                    address.startsWith("KT1")
                is CryptoNetwork.Sui -> address.startsWith("0x") && address.length >= 42
            }
            
            if (!isValidAddress) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Invalid ${_uiState.value.selectedNetwork.displayName} address format"
                )
                return@launch
            }
            
            // Set address in the repository
            when (val repo = currentRepository) {
                is TezosRepository -> repo.setAddressManually(address)
                is SuiRepository -> repo.setAddressManually(address)
            }
            
            _uiState.value = _uiState.value.copy(
                connectionState = WalletConnectionState.Connected(
                    address = address,
                    network = _uiState.value.selectedNetwork
                ),
                successMessage = "Connected: ${shortenAddress(address)}",
                errorMessage = null
            )
        }
    }
    
    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
    
    /**
     * Clear success message
     */
    fun clearSuccess() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }
    
    private fun shortenAddress(address: String): String {
        return if (address.length > 16) {
            "${address.take(8)}...${address.takeLast(6)}"
        } else {
            address
        }
    }
    
    /**
     * Factory for creating WalletViewModel with context
     */
    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(WalletViewModel::class.java)) {
                return WalletViewModel(context.applicationContext) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}
