import { DEFAULT_WEIGHTS } from './engine/types.js';
import { mergeWeights } from './snapshot.service.js';

describe('mergeWeights', () => {
  it('keeps the defaults without a setting', () => {
    expect(mergeWeights(undefined)).toEqual(DEFAULT_WEIGHTS);
    expect(mergeWeights('nonsense')).toEqual(DEFAULT_WEIGHTS);
  });

  it('overrides only the numeric keys it knows', () => {
    expect(
      mergeWeights({ homeLocation: 40, nonsense: 'x', employee: '7' }),
    ).toEqual({
      ...DEFAULT_WEIGHTS,
      homeLocation: 40,
    });
  });
});
