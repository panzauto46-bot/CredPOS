package com.credpos.app.blockchain.plugin

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.credpos.app.ui.WalletActivity

/**
 * Capacitor Plugin to bridge the native wallet functionality with the WebView.
 * This allows the web app to trigger the native wallet connection UI.
 */
@CapacitorPlugin(name = "BlockchainWallet")
class BlockchainWalletPlugin : Plugin() {
    
    @PluginMethod
    fun openWalletScreen(call: PluginCall) {
        val network = call.getString("network", "tezos")
        
        activity?.let { act ->
            val intent = Intent(act, WalletActivity::class.java).apply {
                putExtra("initial_network", network)
            }
            act.startActivity(intent)
            
            call.resolve(JSObject().apply {
                put("success", true)
                put("message", "Wallet screen opened")
            })
        } ?: run {
            call.reject("Activity not available")
        }
    }
    
    @PluginMethod
    fun getConnectionStatus(call: PluginCall) {
        val network = call.getString("network", "tezos")
        
        // Check shared preferences for connection status
        val prefsName = if (network == "tezos") "tezos_wallet_prefs" else "sui_wallet_prefs"
        val prefs = context.getSharedPreferences(prefsName, android.content.Context.MODE_PRIVATE)
        val address = prefs.getString("connected_address", null)
        
        call.resolve(JSObject().apply {
            put("connected", address != null)
            put("address", address ?: "")
            put("network", network)
        })
    }
    
    @PluginMethod
    fun disconnectWallet(call: PluginCall) {
        val network = call.getString("network", "tezos")
        
        // Clear shared preferences
        val prefsName = if (network == "tezos") "tezos_wallet_prefs" else "sui_wallet_prefs"
        val prefs = context.getSharedPreferences(prefsName, android.content.Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        
        call.resolve(JSObject().apply {
            put("success", true)
            put("message", "Wallet disconnected")
        })
    }
}
