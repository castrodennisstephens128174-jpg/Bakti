import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wordmark } from '@/ui/components/Logo';
import {
  AllowanceStatusBadge,
  AssetBadge,
  PayoutStatusBadge,
  SimulationNote,
} from '@/ui/components/ui';
import { fmtAsset, fmtPeriod, ordinal, PAYOUT_LABEL, shortKey } from '@/ui/lib/format';

describe('badges render key text', () => {
  it('AssetBadge shows the asset code', () => {
    render(<AssetBadge asset="USDC" />);
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('PayoutStatusBadge maps status to a human label', () => {
    render(<PayoutStatusBadge status="settled" />);
    expect(screen.getByText(PAYOUT_LABEL.settled)).toBeInTheDocument();
  });

  it('AllowanceStatusBadge shows the plan status', () => {
    render(<AllowanceStatusBadge status="active" />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });
});

describe('SimulationNote', () => {
  it('renders its explanatory children', () => {
    render(<SimulationNote>Cash pickup is a mainnet simulation</SimulationNote>);
    expect(screen.getByText(/mainnet simulation/i)).toBeInTheDocument();
  });
});

describe('Wordmark', () => {
  it('renders the Bakti wordmark text', () => {
    render(<Wordmark />);
    expect(screen.getByText('bakti')).toBeInTheDocument();
  });
});

describe('format helpers', () => {
  it('formats amounts, periods, ordinals and keys', () => {
    expect(fmtAsset('25.5000000', 'USDC')).toBe('25.5 USDC');
    expect(fmtPeriod('2026-07')).toBe('Jul 2026');
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(22)).toBe('22nd');
    expect(shortKey('GABCDEF12345678', 4, 4)).toBe('GABC…5678');
  });
});
