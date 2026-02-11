package com.credpos.app.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.credpos.app.blockchain.CryptoNetwork
import com.credpos.app.blockchain.WalletConnectionState
import com.credpos.app.ui.theme.*

/**
 * Wallet connection card component.
 * Displays connection status and handles connect/disconnect actions.
 */
@Composable
fun WalletConnectionCard(
    network: CryptoNetwork,
    connectionState: WalletConnectionState,
    isLoading: Boolean,
    onConnectClick: () -> Unit,
    onDisconnectClick: () -> Unit,
    onSignClick: () -> Unit,
    onManualAddressInput: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val isConnected = connectionState is WalletConnectionState.Connected
    
    Card(
        modifier = modifier
            .fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header with network info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    NetworkIcon(network = network, size = 40)
                    
                    Column {
                        Text(
                            text = "${network.displayName} Wallet",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = network.networkType.displayName,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                // Connection status indicator
                ConnectionStatusBadge(
                    connectionState = connectionState,
                    isLoading = isLoading
                )
            }
            
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
            
            // Connection content
            AnimatedContent(
                targetState = connectionState,
                transitionSpec = {
                    fadeIn(animationSpec = tween(300)) togetherWith
                            fadeOut(animationSpec = tween(300))
                },
                label = "connection_state_animation"
            ) { state ->
                when (state) {
                    is WalletConnectionState.Connected -> {
                        ConnectedContent(
                            address = state.address,
                            network = network,
                            onDisconnectClick = onDisconnectClick,
                            onSignClick = onSignClick
                        )
                    }
                    is WalletConnectionState.Connecting -> {
                        ConnectingContent()
                    }
                    is WalletConnectionState.Error -> {
                        ErrorContent(
                            message = state.message,
                            network = network,
                            onRetryClick = onConnectClick,
                            onManualAddressInput = onManualAddressInput
                        )
                    }
                    WalletConnectionState.Disconnected -> {
                        DisconnectedContent(
                            network = network,
                            isLoading = isLoading,
                            onConnectClick = onConnectClick,
                            onManualAddressInput = onManualAddressInput
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ConnectedContent(
    address: String,
    network: CryptoNetwork,
    onDisconnectClick: () -> Unit,
    onSignClick: () -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Address display
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Connected Address",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = address,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                // Verified badge
                VerifiedBadge(network = network)
            }
        }
        
        // Action buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Sign Credit Score button
            Button(
                onClick = onSignClick,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = when (network) {
                        is CryptoNetwork.Tezos -> TezosBlue
                        is CryptoNetwork.Sui -> SuiBlue
                    }
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Score")
            }
            
            // Disconnect button
            OutlinedButton(
                onClick = onDisconnectClick,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = ErrorRed
                ),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = Brush.horizontalGradient(listOf(ErrorRed, ErrorRed))
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Disconnect")
            }
        }
    }
}

@Composable
private fun ConnectingContent() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        val infiniteTransition = rememberInfiniteTransition(label = "loading")
        val scale by infiniteTransition.animateFloat(
            initialValue = 0.8f,
            targetValue = 1.2f,
            animationSpec = infiniteRepeatable(
                animation = tween(600),
                repeatMode = RepeatMode.Reverse
            ),
            label = "loading_scale"
        )
        
        CircularProgressIndicator(
            modifier = Modifier
                .size(32.dp)
                .scale(scale),
            strokeWidth = 3.dp
        )
        Spacer(modifier = Modifier.width(16.dp))
        Text(
            text = "Connecting to wallet...",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ErrorContent(
    message: String,
    network: CryptoNetwork,
    onRetryClick: () -> Unit,
    onManualAddressInput: ((String) -> Unit)? = null
) {
    var showManualInput by remember { mutableStateOf(false) }
    var manualAddress by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Surface(
            color = ErrorRed.copy(alpha = 0.1f),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = ErrorRed,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = ErrorRed
                )
            }
        }
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = onRetryClick,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Retry")
            }
            
            if (onManualAddressInput != null) {
                OutlinedButton(
                    onClick = { showManualInput = !showManualInput },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Manual")
                }
            }
        }
        
        // Manual input section
        AnimatedVisibility(visible = showManualInput && onManualAddressInput != null) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = manualAddress,
                    onValueChange = { manualAddress = it },
                    label = { Text("Paste ${network.displayName} Address") },
                    placeholder = { 
                        Text(
                            when (network) {
                                is CryptoNetwork.Tezos -> "tz1..."
                                is CryptoNetwork.Sui -> "0x..."
                            }
                        ) 
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
                
                Button(
                    onClick = { 
                        onManualAddressInput?.invoke(manualAddress)
                        showManualInput = false
                    },
                    enabled = manualAddress.isNotBlank(),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = when (network) {
                            is CryptoNetwork.Tezos -> TezosBlue
                            is CryptoNetwork.Sui -> SuiBlue
                        }
                    )
                ) {
                    Text("Connect with Address")
                }
            }
        }
    }
}

@Composable
private fun DisconnectedContent(
    network: CryptoNetwork,
    isLoading: Boolean,
    onConnectClick: () -> Unit,
    onManualAddressInput: ((String) -> Unit)? = null
) {
    var showManualInput by remember { mutableStateOf(false) }
    var manualAddress by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Info text
        Surface(
            color = InfoBlue.copy(alpha = 0.1f),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.Info,
                    contentDescription = null,
                    tint = InfoBlue,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = when (network) {
                        is CryptoNetwork.Tezos -> "Connect using Temple, AirGap, or Kukai wallet"
                        is CryptoNetwork.Sui -> "Connect using Sui Wallet, Suiet, or Ethos"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = InfoBlue
                )
            }
        }
        
        // Connect button
        Button(
            onClick = onConnectClick,
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = when (network) {
                    is CryptoNetwork.Tezos -> TezosBlue
                    is CryptoNetwork.Sui -> SuiBlue
                }
            )
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
            } else {
                Icon(
                    imageVector = Icons.Default.AccountBalanceWallet,
                    contentDescription = null,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "Connect ${network.displayName} Wallet",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
        
        // Manual input toggle
        if (onManualAddressInput != null) {
            TextButton(
                onClick = { showManualInput = !showManualInput }
            ) {
                Text(
                    text = if (showManualInput) "Hide Manual Input" else "Or paste address manually",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            // Manual input section
            AnimatedVisibility(visible = showManualInput) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = manualAddress,
                        onValueChange = { manualAddress = it },
                        label = { Text("Wallet Address") },
                        placeholder = { 
                            Text(
                                when (network) {
                                    is CryptoNetwork.Tezos -> "tz1ZF8vFYS8P2v2XodnHsZS8RDYPanDrPhcU"
                                    is CryptoNetwork.Sui -> "0xf0606c133b7f6b56e4ba6fb296e30727..."
                                }
                            ) 
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true,
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.ContentPaste,
                                contentDescription = null
                            )
                        }
                    )
                    
                    Button(
                        onClick = { 
                            onManualAddressInput.invoke(manualAddress)
                        },
                        enabled = manualAddress.isNotBlank(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = when (network) {
                                is CryptoNetwork.Tezos -> TezosBlue
                                is CryptoNetwork.Sui -> SuiBlue
                            }
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Use This Address")
                    }
                }
            }
        }
    }
}


/**
 * Connection status badge component
 */
@Composable
fun ConnectionStatusBadge(
    connectionState: WalletConnectionState,
    isLoading: Boolean,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, contentColor, text) = when {
        isLoading -> Triple(
            WarningAmber.copy(alpha = 0.15f),
            WarningAmber,
            "Connecting"
        )
        connectionState is WalletConnectionState.Connected -> Triple(
            SuccessGreen.copy(alpha = 0.15f),
            SuccessGreen,
            "Connected"
        )
        connectionState is WalletConnectionState.Error -> Triple(
            ErrorRed.copy(alpha = 0.15f),
            ErrorRed,
            "Error"
        )
        else -> Triple(
            MaterialTheme.colorScheme.outline.copy(alpha = 0.15f),
            MaterialTheme.colorScheme.onSurfaceVariant,
            "Disconnected"
        )
    }
    
    Surface(
        modifier = modifier,
        color = backgroundColor,
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Animated dot indicator
            if (isLoading) {
                val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                val alpha by infiniteTransition.animateFloat(
                    initialValue = 0.3f,
                    targetValue = 1f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(500),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "pulse_alpha"
                )
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(
                            color = contentColor.copy(alpha = alpha),
                            shape = CircleShape
                        )
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(
                            color = contentColor,
                            shape = CircleShape
                        )
                )
            }
            
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                color = contentColor,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

/**
 * Verified badge component showing the active network
 */
@Composable
fun VerifiedBadge(
    network: CryptoNetwork,
    modifier: Modifier = Modifier
) {
    val gradientColors = when (network) {
        is CryptoNetwork.Tezos -> listOf(TezosBlue, TezosGreen)
        is CryptoNetwork.Sui -> listOf(SuiPurple, SuiBlue)
    }
    
    Surface(
        modifier = modifier,
        color = Color.Transparent,
        shape = RoundedCornerShape(8.dp)
    ) {
        Box(
            modifier = Modifier
                .background(
                    brush = Brush.horizontalGradient(gradientColors.map { it.copy(alpha = 0.15f) }),
                    shape = RoundedCornerShape(8.dp)
                )
                .border(
                    width = 1.dp,
                    brush = Brush.horizontalGradient(gradientColors.map { it.copy(alpha = 0.5f) }),
                    shape = RoundedCornerShape(8.dp)
                )
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Verified,
                    contentDescription = "Verified",
                    tint = gradientColors.first(),
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = "Verified",
                    style = MaterialTheme.typography.labelSmall,
                    color = gradientColors.first(),
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
