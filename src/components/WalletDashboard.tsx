import { useState, useEffect } from 'react';
import { getWallet, lockWallet } from '../crypto/walletManager';
import { ethers } from 'ethers';
import { SendForm } from './SendForm';
import { TransactionHistory } from './TransactionHistory';

interface WalletDashboardProps {
  onLock: () => void;
}

export function WalletDashboard({ onLock }: WalletDashboardProps) {
  const wallet = getWallet();
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet) {
        // Using a public provider for simplicity
        const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
        const balance = await provider.getBalance(wallet.address);
        setBalance(ethers.formatEther(balance));
      }
    };

    fetchBalance();
  }, [wallet]);

  const handleLock = () => {
    lockWallet();
    onLock();
  };

  if (!wallet) {
    return <div>Wallet is locked.</div>;
  }

  return (
    <div>
      <h2>Wallet Dashboard</h2>
      <p>Address: {wallet.address}</p>
      <p>Balance: {balance ? `${balance} ETH` : 'Loading...'}</p>
      <button onClick={handleLock}>Lock Wallet</button>
      <hr />
      <SendForm />
      <hr />
      <TransactionHistory />
    </div>
  );
}
