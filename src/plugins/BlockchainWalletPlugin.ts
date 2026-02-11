/**
 * TypeScript definitions for the BlockchainWallet Capacitor plugin.
 * Use this module to interact with native wallet functionality from your web app.
 */

import { registerPlugin } from '@capacitor/core';

export interface BlockchainWalletPlugin {
  /**
   * Open the native wallet connection screen
   * @param options.network - The blockchain network to use ('tezos' or 'sui')
   */
  openWalletScreen(options: { network: 'tezos' | 'sui' }): Promise<{
    success: boolean;
    message: string;
  }>;

  /**
   * Get the current connection status for a network
   * @param options.network - The blockchain network to check
   */
  getConnectionStatus(options: { network: 'tezos' | 'sui' }): Promise<{
    connected: boolean;
    address: string;
    network: string;
  }>;

  /**
   * Disconnect the wallet for a specific network
   * @param options.network - The blockchain network to disconnect
   */
  disconnectWallet(options: { network: 'tezos' | 'sui' }): Promise<{
    success: boolean;
    message: string;
  }>;
}

const BlockchainWallet = registerPlugin<BlockchainWalletPlugin>('BlockchainWallet');

export default BlockchainWallet;

// Re-export for convenience
export { BlockchainWallet };
