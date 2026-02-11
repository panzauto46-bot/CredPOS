package com.credpos.app.blockchain.sui

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import com.credpos.app.blockchain.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.UUID

/**
 * Sui implementation using deep linking for Devnet connectivity.
 * Handles wallet connection via Sui Wallet deep links with real callback handling.
 */
class SuiRepository(
    private val context: Context
) : BlockchainRepository {
    
    companion object {
        private const val TAG = "SuiRepository"
        private const val PREFS_NAME = "sui_wallet_prefs"
        private const val KEY_ADDRESS = "connected_address"
        private const val KEY_PUBLIC_KEY = "public_key"
        private const val KEY_SESSION_ID = "session_id"
        
        // Known Sui wallet package names
        private val KNOWN_WALLETS = listOf(
            "com.mystenlabs.suiwallet",    // Official Sui Wallet
            "io.suiet.app",                 // Suiet Wallet
            "app.ethos.wallet",             // Ethos Wallet
            "com.martianwallet.sui"         // Martian Wallet
        )
        
        // Sui wallet deep link schemes
        private const val SUI_SCHEME = "sui://"
        private const val SUIET_SCHEME = "suiet://"
    }
    
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    private val _connectionState = MutableStateFlow<WalletConnectionState>(WalletConnectionState.Disconnected)
    override val connectionState: StateFlow<WalletConnectionState> = _connectionState.asStateFlow()
    
    override val network: CryptoNetwork = CryptoNetwork.Sui
    
    init {
        // Restore previous session if exists
        restoreSession()
    }
    
    private fun restoreSession() {
        val savedAddress = prefs.getString(KEY_ADDRESS, null)
        val savedPublicKey = prefs.getString(KEY_PUBLIC_KEY, null)
        
        if (savedAddress != null) {
            _connectionState.value = WalletConnectionState.Connected(
                address = savedAddress,
                network = network,
                publicKey = savedPublicKey
            )
        }
    }
    
    override suspend fun connectWallet(
        onSuccess: (address: String) -> Unit,
        onError: (String) -> Unit
    ) {
        try {
            _connectionState.value = WalletConnectionState.Connecting
            
            // Check if any Sui wallet is installed
            if (!isWalletInstalled()) {
                _connectionState.value = WalletConnectionState.Error("No Sui wallet installed")
                onError("No Sui wallet app found. Please install Sui Wallet, Suiet, or Ethos wallet.")
                return
            }
            
            // Generate session for connection
            val sessionId = UUID.randomUUID().toString()
            
            // Build connection request with callback
            val connectionRequest = buildConnectionRequest(sessionId)
            
            // Try different deep link schemes
            val deepLinkUri = buildDeepLinkUri(connectionRequest)
            
            val intent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            
            // Set up callback to receive the response
            WalletCallbackManager.setSuiConnectionCallback { address, publicKey, error ->
                scope.launch {
                    if (error != null) {
                        Log.e(TAG, "Connection callback error: $error")
                        _connectionState.value = WalletConnectionState.Error(error)
                        onError(error)
                    } else if (address != null) {
                        Log.d(TAG, "Connection callback success: $address")
                        
                        // Save session
                        prefs.edit()
                            .putString(KEY_ADDRESS, address)
                            .putString(KEY_PUBLIC_KEY, publicKey)
                            .putString(KEY_SESSION_ID, sessionId)
                            .apply()
                        
                        _connectionState.value = WalletConnectionState.Connected(
                            address = address,
                            network = network,
                            publicKey = publicKey
                        )
                        
                        onSuccess(address)
                    } else {
                        _connectionState.value = WalletConnectionState.Error("No address received")
                        onError("No wallet address received from wallet app")
                    }
                }
            }
            
            try {
                context.startActivity(intent)
                Log.d(TAG, "Wallet app launched, waiting for callback...")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch wallet", e)
                WalletCallbackManager.cancelSuiConnection()
                _connectionState.value = WalletConnectionState.Error("Failed to open wallet")
                onError("Failed to open wallet app: ${e.message}")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Connect wallet error", e)
            _connectionState.value = WalletConnectionState.Error(e.message ?: "Unknown error")
            onError(e.message ?: "Failed to connect wallet")
        }
    }
    
    private fun buildDeepLinkUri(request: String): Uri {
        // Try to determine which wallet is installed and use appropriate scheme
        val packageManager = context.packageManager
        
        for (packageName in KNOWN_WALLETS) {
            try {
                packageManager.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
                
                return when (packageName) {
                    "io.suiet.app" -> Uri.parse("${SUIET_SCHEME}connect?data=$request&callback=credpos://sui-callback")
                    else -> Uri.parse("${SUI_SCHEME}connect?data=$request&callback=credpos://sui-callback")
                }
            } catch (e: PackageManager.NameNotFoundException) {
                continue
            }
        }
        
        // Default to standard Sui scheme
        return Uri.parse("${SUI_SCHEME}connect?data=$request&callback=credpos://sui-callback")
    }
    
    private fun buildConnectionRequest(sessionId: String): String {
        val request = JSONObject().apply {
            put("id", sessionId)
            put("method", "connect")
            put("callbackUrl", "credpos://sui-callback")
            put("params", JSONObject().apply {
                put("appName", "CredPOS")
                put("appUrl", "https://credpos.app")
                put("appIcon", "https://credpos.app/icon.png")
                put("network", "devnet")
                put("permissions", JSONArray().apply {
                    put("viewAccount")
                    put("suggestTransactions")
                })
            })
        }
        
        return android.util.Base64.encodeToString(
            request.toString().toByteArray(),
            android.util.Base64.URL_SAFE or android.util.Base64.NO_WRAP
        )
    }
    
    override suspend fun disconnectWallet() {
        try {
            // Clear stored session
            prefs.edit().clear().apply()
            
            _connectionState.value = WalletConnectionState.Disconnected
            
            Log.d(TAG, "Wallet disconnected successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting wallet", e)
        }
    }
    
    override suspend fun signCreditScore(score: String): SigningResult {
        return withContext(Dispatchers.IO) {
            try {
                val currentState = _connectionState.value
                
                if (currentState !is WalletConnectionState.Connected) {
                    return@withContext SigningResult.Error("Wallet not connected")
                }
                
                // Prepare the message to sign
                val messageToSign = prepareSigningPayload(score)
                val messageBytes = messageToSign.toByteArray()
                val encodedMessage = android.util.Base64.encodeToString(
                    messageBytes,
                    android.util.Base64.URL_SAFE or android.util.Base64.NO_WRAP
                )
                
                // Build signing request
                val signingRequest = JSONObject().apply {
                    put("id", UUID.randomUUID().toString())
                    put("method", "signPersonalMessage")
                    put("callbackUrl", "credpos://sui-callback")
                    put("params", JSONObject().apply {
                        put("message", encodedMessage)
                        put("account", currentState.address)
                    })
                }
                
                val encodedRequest = android.util.Base64.encodeToString(
                    signingRequest.toString().toByteArray(),
                    android.util.Base64.URL_SAFE or android.util.Base64.NO_WRAP
                )
                
                // Create deep link for signing
                val signUri = Uri.parse("${SUI_SCHEME}sign?data=$encodedRequest&callback=credpos://sui-callback")
                
                val intent = Intent(Intent.ACTION_VIEW, signUri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                
                val hash = computeHash(messageToSign)
                
                try {
                    context.startActivity(intent)
                    
                    // Return with a hash - signature will be received via callback
                    SigningResult.Success(
                        signature = "0xPending_${hash.take(20)}",
                        hash = hash
                    )
                    
                } catch (e: Exception) {
                    SigningResult.Error("Failed to open wallet for signing: ${e.message}")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Sign credit score error", e)
                SigningResult.Error(e.message ?: "Signing failed")
            }
        }
    }
    
    private fun prepareSigningPayload(score: String): String {
        val payload = JSONObject().apply {
            put("app", "CredPOS")
            put("action", "credit_score_verification")
            put("score", score)
            put("timestamp", System.currentTimeMillis())
            put("network", "devnet")
        }
        return payload.toString()
    }
    
    private fun computeHash(data: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(data.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
    
    override fun isWalletInstalled(): Boolean {
        val packageManager = context.packageManager
        
        return KNOWN_WALLETS.any { packageName ->
            try {
                packageManager.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
                true
            } catch (e: PackageManager.NameNotFoundException) {
                false
            }
        } || canHandleDeepLink()
    }
    
    private fun canHandleDeepLink(): Boolean {
        val suiIntent = Intent(Intent.ACTION_VIEW, Uri.parse(SUI_SCHEME))
        val suietIntent = Intent(Intent.ACTION_VIEW, Uri.parse(SUIET_SCHEME))
        
        return suiIntent.resolveActivity(context.packageManager) != null ||
               suietIntent.resolveActivity(context.packageManager) != null
    }
    
    override fun getConnectedAddress(): String? {
        return (connectionState.value as? WalletConnectionState.Connected)?.address
    }
    
    override suspend fun verifyConnection(): Boolean {
        val currentState = _connectionState.value
        
        if (currentState !is WalletConnectionState.Connected) {
            return false
        }
        
        return withContext(Dispatchers.IO) {
            try {
                // Query Sui RPC to verify address exists on Devnet
                val url = URL(CryptoNetwork.Sui.RPC_URL)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                
                val requestBody = JSONObject().apply {
                    put("jsonrpc", "2.0")
                    put("id", 1)
                    put("method", "sui_getObject")
                    put("params", JSONArray().apply {
                        put(currentState.address)
                    })
                }
                
                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(requestBody.toString())
                    writer.flush()
                }
                
                val responseCode = connection.responseCode
                
                if (responseCode == 200) {
                    val response = BufferedReader(InputStreamReader(connection.inputStream)).use {
                        it.readText()
                    }
                    val jsonResponse = JSONObject(response)
                    !jsonResponse.has("error")
                } else {
                    // Return true to maintain session even if RPC fails
                    true
                }
                
            } catch (e: Exception) {
                Log.w(TAG, "Failed to verify connection", e)
                // Return true to maintain session even if RPC fails
                true
            }
        }
    }
    
    /**
     * Manually set wallet address (for testing or manual input)
     */
    fun setAddressManually(address: String, publicKey: String? = null) {
        prefs.edit()
            .putString(KEY_ADDRESS, address)
            .putString(KEY_PUBLIC_KEY, publicKey)
            .apply()
        
        _connectionState.value = WalletConnectionState.Connected(
            address = address,
            network = network,
            publicKey = publicKey
        )
    }
}
