import { useState, useEffect } from 'react';
import { getWallet } from '../crypto/walletManager';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
}

export function TransactionHistory() {
  const wallet = getWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!wallet) return;

      setIsLoading(true);
      setError(null);

      try {
        // Using Etherscan API for Sepolia testnet
        const response = await fetch(
          `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${wallet.address}&startblock=0&endblock=99999999&sort=asc&apikey=YOUR_API_KEY`
        );
        const data = await response.json();
        if (data.status === '1') {
          setTransactions(data.result);
        } else {
          setError(data.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [wallet]);

  if (!wallet) {
    return null;
  }

  return (
    <div>
      <h3>Transaction History</h3>
      {isLoading && <p>Loading transactions...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {transactions.length > 0 ? (
        <ul>
          {transactions.map((tx) => (
            <li key={tx.hash}>
              <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                {tx.hash.substring(0, 10)}...
              </a>
              <span>From: {tx.from.substring(0, 6)}...</span>
              <span>To: {tx.to.substring(0, 6)}...</span>
              <span>Value: {tx.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No transactions found.</p>
      )}
    </div>
  );
}
