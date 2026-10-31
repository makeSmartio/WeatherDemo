import { describe, expect, it } from 'vitest';
import { describeWeatherCode } from './weatherCodes';

describe('describeWeatherCode', () => {
  it('maps known WMO codes to labels and icons', () => {
    expect(describeWeatherCode(0)).toEqual({ label: 'Clear sky', icon: '☀️' });
    expect(describeWeatherCode(3).label).toBe('Overcast');
    expect(describeWeatherCode(95).label).toBe('Thunderstorm');
  });

  it('falls back to an unknown label for unrecognized codes', () => {
    expect(describeWeatherCode(1234)).toEqual({
      label: 'Unknown conditions',
      icon: '❓',
    });
  });
});
