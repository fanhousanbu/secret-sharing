interface DisplaySharesProps {
  shares: string[];
  onDone: () => void;
}

export function DisplayShares({ shares, onDone }: DisplaySharesProps) {
  return (
    <div>
      <h2>Recovery Shares</h2>
      <p>Please save these shares securely. You will need them to recover your wallet.</p>
      <ul>
        {shares.map((share, index) => (
          <li key={index}>{share}</li>
        ))}
      </ul>
      <button onClick={onDone}>Done</button>
    </div>
  );
}
