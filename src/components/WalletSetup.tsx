import { useState, useEffect } from 'react';
import { createNewWallet, unlockWallet } from '../crypto/walletManager';
import { splitSecret } from '../crypto/shamir';
import { DisplayShares } from './DisplayShares';
import { RecoverWallet } from './RecoverWallet';
import { mnemonicToBigInt } from '../crypto/utils';
import { SecretSharingConfig, Share } from '../crypto/types';

const VAULT_KEY = 'encryptedVault';

export function WalletSetup() {
  const [hasVault, setHasVault] = useState(false);
  const [password, setPassword] = useState('');
  const [shares, setShares] = useState<string[] | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const vault = localStorage.getItem(VAULT_KEY);
    setHasVault(!!vault);
  }, []);

  const handleUnlock = async () => {
    const success = await unlockWallet(password);
    if (success) {
      // Reload to update app state
      window.location.reload();
    } else {
      alert('Failed to unlock wallet');
    }
  };

  const handleCreate = async () => {
    const mnemonic = await createNewWallet(password);
    const secretBigInt = mnemonicToBigInt(mnemonic);
    const config: SecretSharingConfig = { threshold: 3, totalShares: 5 };
    const newShares: Share[] = splitSecret(secretBigInt, config);
    setShares(newShares.map(share => `${share.id}-${share.value.toString()}`));
  };

  const onDoneDisplayingShares = () => {
    setShares(null);
    window.location.reload();
  };

  const handleRecoverySuccess = (success: boolean) => {
    if (success) {
      setIsRecovering(false);
      window.location.reload();
    }
  };

  if (isRecovering) {
    return <RecoverWallet onRecover={handleRecoverySuccess} />;
  }

  if (shares) {
    return <DisplayShares shares={shares} onDone={onDoneDisplayingShares} />;
  }

  if (hasVault) {
    return (
      <div>
        <h2>Unlock Wallet</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <button onClick={handleUnlock}>Unlock</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Wallet Setup</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter a new password"
      />
      <button onClick={handleCreate}>Create New Wallet</button>
      <button onClick={() => setIsRecovering(true)}>Import from Recovery Shares</button>
    </div>
  );
}

