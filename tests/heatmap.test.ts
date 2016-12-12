import {toScale, defaultDomain, defaultColor} from '../src/heatmap';

describe('toScale', () => {
  it('is method', () => {
    expect(typeof toScale).toEqual('function');
  });
  it('produces full gamut', () => {
    var value = null; // TODO
    var domain = defaultDomain(value);
    var range = defaultColor(value);
    var scale = toScale(value).domain(domain).range(range);
    expect(scale(-1)).toEqual('#00F');
    expect(scale(1)).toEqual('#FFF');
  });
});
