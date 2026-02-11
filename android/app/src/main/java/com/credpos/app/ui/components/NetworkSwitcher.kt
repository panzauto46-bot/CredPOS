package com.credpos.app.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.credpos.app.blockchain.CryptoNetwork
import com.credpos.app.ui.theme.*

/**
 * Network Switcher dropdown component for the Top Bar.
 * Allows switching between Tezos and Sui networks.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NetworkSwitcher(
    selectedNetwork: CryptoNetwork,
    onNetworkSelected: (CryptoNetwork) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    val rotationAngle by animateFloatAsState(
        targetValue = if (expanded) 180f else 0f,
        animationSpec = tween(durationMillis = 200),
        label = "dropdown_rotation"
    )
    
    val networks = CryptoNetwork.all()
    
    Box(modifier = modifier) {
        // Selected network button
        Surface(
            modifier = Modifier
                .clip(RoundedCornerShape(12.dp))
                .clickable { expanded = !expanded },
            color = MaterialTheme.colorScheme.surfaceVariant,
            shape = RoundedCornerShape(12.dp),
            tonalElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Network icon
                NetworkIcon(
                    network = selectedNetwork,
                    size = 24
                )
                
                // Network name
                Text(
                    text = selectedNetwork.displayName,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
                
                // Network type badge
                NetworkTypeBadge(network = selectedNetwork)
                
                // Dropdown arrow
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = "Expand",
                    modifier = Modifier
                        .size(20.dp)
                        .rotate(rotationAngle),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        // Dropdown menu
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier
                .background(MaterialTheme.colorScheme.surface)
                .width(200.dp)
        ) {
            networks.forEach { network ->
                DropdownMenuItem(
                    text = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            NetworkIcon(network = network, size = 28)
                            
                            Column {
                                Text(
                                    text = network.displayName,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = network.networkType.displayName,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    },
                    onClick = {
                        onNetworkSelected(network)
                        expanded = false
                    },
                    leadingIcon = null,
                    trailingIcon = {
                        if (selectedNetwork == network) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Selected",
                                tint = SuccessGreen
                            )
                        }
                    },
                    modifier = Modifier.padding(horizontal = 4.dp)
                )
                
                if (network != networks.last()) {
                    HorizontalDivider(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                    )
                }
            }
        }
    }
}

/**
 * Network icon component with gradient background
 */
@Composable
fun NetworkIcon(
    network: CryptoNetwork,
    size: Int,
    modifier: Modifier = Modifier
) {
    val gradientColors = when (network) {
        is CryptoNetwork.Tezos -> listOf(TezosBlue, TezosGreen)
        is CryptoNetwork.Sui -> listOf(SuiPurple, SuiBlue)
    }
    
    Box(
        modifier = modifier
            .size(size.dp)
            .background(
                brush = Brush.linearGradient(gradientColors),
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = when (network) {
                is CryptoNetwork.Tezos -> "ꜩ"
                is CryptoNetwork.Sui -> "S"
            },
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = (size * 0.5).sp
        )
    }
}

/**
 * Badge showing the network type (Testnet/Ghostnet/Devnet)
 */
@Composable
fun NetworkTypeBadge(
    network: CryptoNetwork,
    modifier: Modifier = Modifier
) {
    val backgroundColor = when (network.networkType) {
        com.credpos.app.blockchain.NetworkType.GHOSTNET -> TezosBlue.copy(alpha = 0.15f)
        com.credpos.app.blockchain.NetworkType.DEVNET -> SuiPurple.copy(alpha = 0.15f)
        com.credpos.app.blockchain.NetworkType.TESTNET -> InfoBlue.copy(alpha = 0.15f)
    }
    
    val textColor = when (network.networkType) {
        com.credpos.app.blockchain.NetworkType.GHOSTNET -> TezosBlue
        com.credpos.app.blockchain.NetworkType.DEVNET -> SuiPurple
        com.credpos.app.blockchain.NetworkType.TESTNET -> InfoBlue
    }
    
    Surface(
        modifier = modifier,
        color = backgroundColor,
        shape = RoundedCornerShape(4.dp)
    ) {
        Text(
            text = when (network.networkType) {
                com.credpos.app.blockchain.NetworkType.GHOSTNET -> "GHOST"
                com.credpos.app.blockchain.NetworkType.DEVNET -> "DEV"
                com.credpos.app.blockchain.NetworkType.TESTNET -> "TEST"
            },
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            color = textColor,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold
        )
    }
}
