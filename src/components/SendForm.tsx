import { useState } from 'react';
import { getWallet } from '../crypto/walletManager';
import { ethers } from 'ethers';

export function SendForm() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = async () => {
    const wallet = getWallet();
    if (!wallet) {
      setError('Wallet is locked');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
      const connectedWallet = wallet.connect(provider);
      const tx = await connectedWallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      setSuccess(`Transaction successful: ${tx.hash}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3>Send ETH</h3>
      <input
        type="text"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="Recipient Address"
      />
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in ETH"
      />
      <button onClick={handleSend} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}
