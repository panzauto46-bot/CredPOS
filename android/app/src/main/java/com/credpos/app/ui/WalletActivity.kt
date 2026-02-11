package com.credpos.app.ui

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.credpos.app.blockchain.WalletCallbackManager
import com.credpos.app.ui.screens.WalletScreen
import com.credpos.app.ui.theme.CredPOSTheme

/**
 * Compose Activity for the Multi-Chain Wallet feature.
 * This can be launched from the main Capacitor WebView when needed.
 * Also handles deep link callbacks from wallet apps.
 */
class WalletActivity : ComponentActivity() {
    
    companion object {
        private const val TAG = "WalletActivity"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Handle any incoming callback from wallet
        handleWalletCallback(intent)
        
        setContent {
            CredPOSTheme(darkTheme = true) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    WalletScreen()
                }
            }
        }
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        Log.d(TAG, "onNewIntent received: ${intent.data}")
        handleWalletCallback(intent)
    }
    
    private fun handleWalletCallback(intent: Intent?) {
        if (intent?.data != null) {
            Log.d(TAG, "Processing wallet callback: ${intent.data}")
            val handled = WalletCallbackManager.handleIntent(intent)
            if (handled) {
                Log.d(TAG, "Wallet callback handled successfully")
            } else {
                Log.d(TAG, "Wallet callback not recognized")
            }
        }
    }
}
