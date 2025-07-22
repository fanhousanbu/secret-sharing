import { useState } from 'react';
import { recoverSecret } from '../crypto/shamir';
import { importWalletFromMnemonic } from '../crypto/walletManager';
import { bigIntToMnemonic } from '../crypto/utils';
import { Share } from '../crypto/types';

interface RecoverWalletProps {
  onRecover: (success: boolean) => void;
}

export function RecoverWallet({ onRecover }: RecoverWalletProps) {
  const [shares, setShares] = useState(['', '', '']);
  const [password, setPassword] = useState('');

  const handleShareChange = (index: number, value: string) => {
    const newShares = [...shares];
    newShares[index] = value;
    setShares(newShares);
  };

  const handleRecover = async () => {
    try {
      const validShares: Share[] = shares.filter(s => s).map(s => {
        const [id, value] = s.split('-');
        return { id: parseInt(id), value: BigInt(value) };
      });
      const mnemonicBigInt = await recoverSecret(validShares, 3);
      const mnemonic = bigIntToMnemonic(mnemonicBigInt);
      await importWalletFromMnemonic(mnemonic, password);
      alert('Wallet recovered successfully!');
      onRecover(true);
    } catch (error) {
      console.error('Failed to recover wallet:', error);
      alert('Failed to recover wallet. Please check your shares.');
      onRecover(false);
    }
  };

  return (
    <div>
      <h2>Recover Wallet from Shares</h2>
      {shares.map((share, index) => (
        <input
          key={index}
          type="text"
          value={share}
          onChange={(e) => handleShareChange(index, e.target.value)}
          placeholder={`Share ${index + 1}`}
        />
      ))}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter a new password"
      />
      <button onClick={handleRecover}>Recover Wallet</button>
    </div>
  );
}
