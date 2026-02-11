package com.credpos.app.ui.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.credpos.app.blockchain.*
import com.credpos.app.ui.components.*
import com.credpos.app.ui.theme.*

/**
 * Main wallet connection screen with network switcher and wallet management.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    viewModel: WalletViewModel = viewModel(
        factory = WalletViewModel.Factory(LocalContext.current)
    )
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    
    // Handle success/error messages
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            viewModel.clearSuccess()
        }
    }
    
    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { message ->
            Toast.makeText(context, message, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }
    
    Scaffold(
        topBar = {
            WalletTopBar(
                selectedNetwork = uiState.selectedNetwork,
                connectionState = uiState.connectionState,
                onNetworkSelected = { viewModel.selectNetwork(it) }
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header section
            WalletHeader(network = uiState.selectedNetwork)
            
            // Wallet connection card
            WalletConnectionCard(
                network = uiState.selectedNetwork,
                connectionState = uiState.connectionState,
                isLoading = uiState.isLoading,
                onConnectClick = { viewModel.connectWallet() },
                onDisconnectClick = { viewModel.disconnectWallet() },
                onSignClick = {
                    // Demo credit score signing
                    viewModel.signCreditScore("750")
                },
                onManualAddressInput = { address ->
                    viewModel.setAddressManually(address)
                }
            )
            
            // Credit Score signing section (visible when connected)
            AnimatedVisibility(
                visible = uiState.connectionState is WalletConnectionState.Connected,
                enter = fadeIn() + slideInVertically(),
                exit = fadeOut() + slideOutVertically()
            ) {
                CreditScoreSigningCard(
                    network = uiState.selectedNetwork,
                    lastResult = uiState.lastSigningResult,
                    isLoading = uiState.isLoading,
                    onSignClick = { score ->
                        viewModel.signCreditScore(score)
                    }
                )
            }
            
            // Network info section
            NetworkInfoCard(network = uiState.selectedNetwork)
            
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletTopBar(
    selectedNetwork: CryptoNetwork,
    connectionState: WalletConnectionState,
    onNetworkSelected: (CryptoNetwork) -> Unit
) {
    val gradientColors = when (selectedNetwork) {
        is CryptoNetwork.Tezos -> listOf(TezosBlue.copy(alpha = 0.1f), TezosGreen.copy(alpha = 0.05f))
        is CryptoNetwork.Sui -> listOf(SuiPurple.copy(alpha = 0.1f), SuiBlue.copy(alpha = 0.05f))
    }
    
    TopAppBar(
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "CredPOS",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                // Connection indicator dot
                if (connectionState is WalletConnectionState.Connected) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(SuccessGreen, shape = androidx.compose.foundation.shape.CircleShape)
                    )
                }
            }
        },
        actions = {
            // Network switcher in the top bar
            NetworkSwitcher(
                selectedNetwork = selectedNetwork,
                onNetworkSelected = onNetworkSelected,
                modifier = Modifier.padding(end = 8.dp)
            )
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun WalletHeader(network: CryptoNetwork) {
    val gradientColors = when (network) {
        is CryptoNetwork.Tezos -> listOf(TezosBlue, TezosGreen)
        is CryptoNetwork.Sui -> listOf(SuiPurple, SuiBlue)
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.horizontalGradient(
                        colors = gradientColors.map { it.copy(alpha = 0.15f) }
                    )
                )
                .padding(24.dp)
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    NetworkIcon(network = network, size = 48)
                    
                    Column {
                        Text(
                            text = "${network.displayName} Network",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = gradientColors.first()
                        )
                        Text(
                            text = network.networkType.displayName,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                Text(
                    text = when (network) {
                        is CryptoNetwork.Tezos -> "Connect your Tezos wallet to sign and verify credit scores on Ghostnet."
                        is CryptoNetwork.Sui -> "Connect your Sui wallet to sign and verify credit scores on Devnet."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun CreditScoreSigningCard(
    network: CryptoNetwork,
    lastResult: SigningResult?,
    isLoading: Boolean,
    onSignClick: (String) -> Unit
) {
    var scoreInput by remember { mutableStateOf("750") }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Score,
                    contentDescription = null,
                    tint = when (network) {
                        is CryptoNetwork.Tezos -> TezosBlue
                        is CryptoNetwork.Sui -> SuiBlue
                    },
                    modifier = Modifier.size(28.dp)
                )
                
                Column {
                    Text(
                        text = "Sign Credit Score",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Create a blockchain-verified signature",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
            
            // Score input
            OutlinedTextField(
                value = scoreInput,
                onValueChange = { newValue ->
                    // Only allow numeric input
                    if (newValue.all { it.isDigit() } && newValue.length <= 3) {
                        scoreInput = newValue
                    }
                },
                label = { Text("Credit Score (300-850)") },
                placeholder = { Text("Enter score") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Numbers,
                        contentDescription = null
                    )
                }
            )
            
            // Sign button
            Button(
                onClick = { onSignClick(scoreInput) },
                enabled = !isLoading && scoreInput.isNotEmpty(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = when (network) {
                        is CryptoNetwork.Tezos -> TezosBlue
                        is CryptoNetwork.Sui -> SuiBlue
                    }
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Credit Score")
            }
            
            // Last signing result
            lastResult?.let { result ->
                when (result) {
                    is SigningResult.Success -> {
                        Surface(
                            color = SuccessGreen.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = SuccessGreen,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Signature Created",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = SuccessGreen,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Signature: ${result.signature.take(20)}...",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                result.hash?.let { hash ->
                                    Text(
                                        text = "Hash: ${hash.take(16)}...",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                    is SigningResult.Error -> {
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
                                    imageVector = Icons.Default.Error,
                                    contentDescription = null,
                                    tint = ErrorRed,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = result.message,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = ErrorRed
                                )
                            }
                        }
                    }
                    SigningResult.Cancelled -> {
                        Surface(
                            color = WarningAmber.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Cancel,
                                    contentDescription = null,
                                    tint = WarningAmber,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Signing was cancelled",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = WarningAmber
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NetworkInfoCard(network: CryptoNetwork) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Network Information",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
            
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
            
            InfoRow(
                label = "Network",
                value = network.displayName
            )
            
            InfoRow(
                label = "Type",
                value = network.networkType.displayName
            )
            
            InfoRow(
                label = "RPC Endpoint",
                value = when (network) {
                    is CryptoNetwork.Tezos -> CryptoNetwork.Tezos.RPC_URL
                    is CryptoNetwork.Sui -> CryptoNetwork.Sui.RPC_URL
                }
            )
            
            InfoRow(
                label = "Explorer",
                value = network.explorerUrl
            )
            
            // Testnet disclaimer
            Surface(
                color = WarningAmber.copy(alpha = 0.1f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = WarningAmber,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "This is a testnet. No real funds are used.",
                        style = MaterialTheme.typography.bodySmall,
                        color = WarningAmber
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.widthIn(max = 180.dp),
            textAlign = TextAlign.End
        )
    }
}
