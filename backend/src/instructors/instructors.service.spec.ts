import { addYears, certificateStatus } from './instructors.service.js';

describe('addYears', () => {
  it('adds the validity years to the issue date', () => {
    expect(addYears('2023-03-31', 5)).toBe('2028-03-31');
  });

  it('normalises 29 February in a non-leap year', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-03-01');
  });

  it('returns null for types that do not expire', () => {
    expect(addYears('2024-01-01', null)).toBeNull();
  });
});

describe('certificateStatus', () => {
  const today = new Date(Date.UTC(2026, 8, 17));

  it('is valid without an expiry date', () => {
    expect(certificateStatus(null, 60, today)).toEqual({
      status: 'valid',
      daysLeft: null,
    });
  });

  it('is expiring inside the warning lead time', () => {
    expect(certificateStatus('2026-10-05', 60, today)).toEqual({
      status: 'expiring',
      daysLeft: 18,
    });
  });

  it('is valid outside the lead time and expired after the date', () => {
    expect(certificateStatus('2027-06-01', 60, today).status).toBe('valid');
    expect(certificateStatus('2026-08-01', 60, today)).toEqual({
      status: 'expired',
      daysLeft: -47,
    });
  });

  it('counts the expiry day itself as still valid', () => {
    expect(certificateStatus('2026-09-17', 60, today).daysLeft).toBe(0);
    expect(certificateStatus('2026-09-17', 60, today).status).toBe('expiring');
  });
});
