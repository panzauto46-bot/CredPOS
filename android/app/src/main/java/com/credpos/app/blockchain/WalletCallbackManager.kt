package com.credpos.app.blockchain

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.util.Base64

/**
 * Singleton manager for handling wallet callbacks.
 * This receives callbacks from wallet apps via deep links and notifies the appropriate repository.
 */
object WalletCallbackManager {
    
    private const val TAG = "WalletCallbackManager"
    
    // Callback listeners
    private var tezosConnectionCallback: ((address: String?, publicKey: String?, error: String?) -> Unit)? = null
    private var suiConnectionCallback: ((address: String?, publicKey: String?, error: String?) -> Unit)? = null
    private var tezosSigningCallback: ((signature: String?, error: String?) -> Unit)? = null
    private var suiSigningCallback: ((signature: String?, error: String?) -> Unit)? = null
    
    // Pending connection state
    private val _pendingTezosConnection = MutableStateFlow(false)
    val pendingTezosConnection: StateFlow<Boolean> = _pendingTezosConnection.asStateFlow()
    
    private val _pendingSuiConnection = MutableStateFlow(false)
    val pendingSuiConnection: StateFlow<Boolean> = _pendingSuiConnection.asStateFlow()
    
    /**
     * Set callback for Tezos wallet connection result.
     */
    fun setTezosConnectionCallback(callback: (address: String?, publicKey: String?, error: String?) -> Unit) {
        tezosConnectionCallback = callback
        _pendingTezosConnection.value = true
    }
    
    /**
     * Set callback for Sui wallet connection result.
     */
    fun setSuiConnectionCallback(callback: (address: String?, publicKey: String?, error: String?) -> Unit) {
        suiConnectionCallback = callback
        _pendingSuiConnection.value = true
    }
    
    /**
     * Set callback for Tezos signing result.
     */
    fun setTezosSigningCallback(callback: (signature: String?, error: String?) -> Unit) {
        tezosSigningCallback = callback
    }
    
    /**
     * Set callback for Sui signing result.
     */
    fun setSuiSigningCallback(callback: (signature: String?, error: String?) -> Unit) {
        suiSigningCallback = callback
    }
    
    /**
     * Handle incoming intent from wallet callback.
     * Returns true if the intent was handled.
     */
    fun handleIntent(intent: Intent?): Boolean {
        val uri = intent?.data ?: return false
        
        Log.d(TAG, "Handling callback URI: $uri")
        
        return when {
            uri.scheme == "credpos" && uri.host == "callback" -> {
                handleTezosCallback(uri)
                true
            }
            uri.scheme == "credpos" && uri.host == "sui-callback" -> {
                handleSuiCallback(uri)
                true
            }
            else -> false
        }
    }
    
    /**
     * Handle Tezos Beacon callback.
     * Temple wallet returns the address in the callback data.
     */
    private fun handleTezosCallback(uri: Uri) {
        Log.d(TAG, "Processing Tezos callback: $uri")
        
        try {
            // Try to parse standard Beacon response format
            val data = uri.getQueryParameter("data")
            val address = uri.getQueryParameter("address")
            val publicKey = uri.getQueryParameter("publicKey") ?: uri.getQueryParameter("public_key")
            val error = uri.getQueryParameter("error")
            val signature = uri.getQueryParameter("signature")
            
            // Handle error
            if (error != null) {
                Log.e(TAG, "Tezos callback error: $error")
                tezosConnectionCallback?.invoke(null, null, error)
                tezosSigningCallback?.invoke(null, error)
                clearTezosCallbacks()
                return
            }
            
            // Handle signing response
            if (signature != null) {
                Log.d(TAG, "Tezos signature received: ${signature.take(20)}...")
                tezosSigningCallback?.invoke(signature, null)
                tezosSigningCallback = null
                return
            }
            
            // Handle connection response - check for address directly
            if (address != null) {
                Log.d(TAG, "Tezos address received directly: $address")
                tezosConnectionCallback?.invoke(address, publicKey, null)
                clearTezosCallbacks()
                return
            }
            
            // Try to parse data parameter (Base64 encoded JSON)
            if (data != null) {
                try {
                    val decodedData = String(Base64.getUrlDecoder().decode(data))
                    Log.d(TAG, "Decoded Tezos data: $decodedData")
                    
                    val json = JSONObject(decodedData)
                    val parsedAddress = json.optString("address", null) 
                        ?: json.optString("sourceAddress", null)
                    val parsedPublicKey = json.optString("publicKey", null)
                    
                    if (parsedAddress != null) {
                        Log.d(TAG, "Tezos address parsed from data: $parsedAddress")
                        tezosConnectionCallback?.invoke(parsedAddress, parsedPublicKey, null)
                        clearTezosCallbacks()
                        return
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to parse Tezos data parameter", e)
                }
            }
            
            // If we got here with no address, report error
            Log.w(TAG, "No address found in Tezos callback")
            tezosConnectionCallback?.invoke(null, null, "No wallet address in callback")
            clearTezosCallbacks()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing Tezos callback", e)
            tezosConnectionCallback?.invoke(null, null, e.message)
            clearTezosCallbacks()
        }
    }
    
    /**
     * Handle Sui wallet callback.
     */
    private fun handleSuiCallback(uri: Uri) {
        Log.d(TAG, "Processing Sui callback: $uri")
        
        try {
            val data = uri.getQueryParameter("data")
            val address = uri.getQueryParameter("address")
            val publicKey = uri.getQueryParameter("publicKey") ?: uri.getQueryParameter("public_key")
            val error = uri.getQueryParameter("error")
            val signature = uri.getQueryParameter("signature")
            
            // Handle error
            if (error != null) {
                Log.e(TAG, "Sui callback error: $error")
                suiConnectionCallback?.invoke(null, null, error)
                suiSigningCallback?.invoke(null, error)
                clearSuiCallbacks()
                return
            }
            
            // Handle signing response
            if (signature != null) {
                Log.d(TAG, "Sui signature received: ${signature.take(20)}...")
                suiSigningCallback?.invoke(signature, null)
                suiSigningCallback = null
                return
            }
            
            // Handle connection response
            if (address != null) {
                Log.d(TAG, "Sui address received: $address")
                suiConnectionCallback?.invoke(address, publicKey, null)
                clearSuiCallbacks()
                return
            }
            
            // Try to parse data parameter
            if (data != null) {
                try {
                    val decodedData = String(Base64.getUrlDecoder().decode(data))
                    Log.d(TAG, "Decoded Sui data: $decodedData")
                    
                    val json = JSONObject(decodedData)
                    val parsedAddress = json.optString("address", null)
                    val parsedPublicKey = json.optString("publicKey", null)
                    
                    if (parsedAddress != null) {
                        Log.d(TAG, "Sui address parsed from data: $parsedAddress")
                        suiConnectionCallback?.invoke(parsedAddress, parsedPublicKey, null)
                        clearSuiCallbacks()
                        return
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to parse Sui data parameter", e)
                }
            }
            
            Log.w(TAG, "No address found in Sui callback")
            suiConnectionCallback?.invoke(null, null, "No wallet address in callback")
            clearSuiCallbacks()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing Sui callback", e)
            suiConnectionCallback?.invoke(null, null, e.message)
            clearSuiCallbacks()
        }
    }
    
    private fun clearTezosCallbacks() {
        tezosConnectionCallback = null
        _pendingTezosConnection.value = false
    }
    
    private fun clearSuiCallbacks() {
        suiConnectionCallback = null
        _pendingSuiConnection.value = false
    }
    
    /**
     * Cancel pending Tezos connection.
     */
    fun cancelTezosConnection() {
        tezosConnectionCallback?.invoke(null, null, "Connection cancelled")
        clearTezosCallbacks()
    }
    
    /**
     * Cancel pending Sui connection.
     */
    fun cancelSuiConnection() {
        suiConnectionCallback?.invoke(null, null, "Connection cancelled")
        clearSuiCallbacks()
    }
    
    /**
     * Manually set wallet address (useful for manual input or testing).
     */
    fun manuallySetTezosAddress(address: String, publicKey: String? = null) {
        tezosConnectionCallback?.invoke(address, publicKey, null)
        clearTezosCallbacks()
    }
    
    fun manuallySetSuiAddress(address: String, publicKey: String? = null) {
        suiConnectionCallback?.invoke(address, publicKey, null)
        clearSuiCallbacks()
    }
}
