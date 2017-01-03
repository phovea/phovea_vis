import {toScale, defaultDomain, defaultColor} from '../src/heatmap/internal';

describe('toScale', () => {
  it('handles negative and positive', () => {
    const value = {
      type: 'real',
      range: [-1, 1]
    };
    const domain = defaultDomain(value);
    const range = defaultColor(value);
    const scale = toScale(value).domain(domain).range(range);
    expect(scale(-1)).toEqual('#0000ff');
    expect(scale(0)).toEqual('#ffffff');
    expect(scale(1)).toEqual('#ff0000');
  });
  it('handles skewed data', () => {
    const value = {
      type: 'real',
      range: [-0.1, 10]
    };
    const domain = defaultDomain(value);
    const range = defaultColor(value);
    const scale = toScale(value).domain(domain).range(range);
    expect(scale(-0.1)).toEqual('#fcfcff');
    expect(scale(0)).toEqual('#ffffff');
    expect(scale(5)).toEqual('#ff8080');
    expect(scale(10)).toEqual('#ff0000');
  });
  it('handles positive', () => {
    const value = {
      type: 'real',
      range: [0, 1]
    };
    const domain = defaultDomain(value);
    const range = defaultColor(value);
    const scale = toScale(value).domain(domain).range(range);
    expect(scale(0)).toEqual('#ffffff');
    expect(scale(0.5)).toEqual('#ff8080'); // interpolation
    expect(scale(1)).toEqual('#ff0000');
  });
  it('handles negative', () => {
    const value = {
      type: 'real',
      range: [-1, 0]
    };
    const domain = defaultDomain(value);
    const range = defaultColor(value);
    const scale = toScale(value).domain(domain).range(range);
    expect(scale(-1)).toEqual('#ffffff'); // TODO: Should be #0000ff?
    expect(scale(0)).toEqual('#ff0000'); // TODO: Should be #ffffff?
  });
});
