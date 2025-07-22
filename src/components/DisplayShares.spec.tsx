import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DisplayShares } from './DisplayShares';


describe('DisplayShares', () => {
  const mockShares = [
    'share1_data',
    'share2_data',
    'share3_data',
  ];
  const mockOnDone = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render the component with provided shares', () => {
    render(<DisplayShares shares={mockShares} onDone={mockOnDone} />);

    expect(screen.getByText('Recovery Shares')).toBeInTheDocument();
    expect(screen.getByText('Please save these shares securely. You will need them to recover your wallet.')).toBeInTheDocument();

    mockShares.forEach(share => {
      expect(screen.getByText(share)).toBeInTheDocument();
    });

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(mockShares.length);
  });

  test('should call onDone when the Done button is clicked', () => {
    render(<DisplayShares shares={mockShares} onDone={mockOnDone} />);

    const doneButton = screen.getByRole('button', { name: /Done/i });
    fireEvent.click(doneButton);

    expect(mockOnDone).toHaveBeenCalledTimes(1);
  });
});
