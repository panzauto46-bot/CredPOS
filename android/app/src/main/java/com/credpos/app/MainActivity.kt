package com.credpos.app

import android.os.Bundle
import android.webkit.WebView
import android.widget.Toast
import com.getcapacitor.BridgeActivity
import com.credpos.app.blockchain.plugin.BlockchainWalletPlugin

class MainActivity : BridgeActivity() {
    private var backPressedTime: Long = 0
    private var backToast: Toast? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        // Register custom plugins before calling super.onCreate()
        registerPlugin(BlockchainWalletPlugin::class.java)
        
        super.onCreate(savedInstanceState)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Get the WebView from Capacitor bridge
        val webView: WebView? = bridge.webView

        if (webView != null && webView.canGoBack()) {
            // If webview can go back, navigate back in webview
            webView.goBack()
        } else {
            // Double tap to exit
            if (backPressedTime + 2000 > System.currentTimeMillis()) {
                backToast?.cancel()
                @Suppress("DEPRECATION")
                super.onBackPressed()
                return
            } else {
                backToast = Toast.makeText(this, "Press again to exit", Toast.LENGTH_SHORT)
                backToast?.show()
            }
            backPressedTime = System.currentTimeMillis()
        }
    }
}
