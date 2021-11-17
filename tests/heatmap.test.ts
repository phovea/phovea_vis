/// <reference types="jest" />
import {DefaultUtils} from '../src/heatmap/DefaultUtils';
import {ScaleUtils} from '../src/heatmap/IScale';
import {INumberValueTypeDesc} from 'tdp_core';

describe('toScale', () => {
  it('handles negative and positive', () => {
    const value: INumberValueTypeDesc = {
      type: 'real',
      range: [-1, 1]
    };
    const domain = DefaultUtils.defaultDomain(value);
    const range = DefaultUtils.defaultColor(value);
    const scale = ScaleUtils.toScale(value).domain(domain).range(range);
    expect(scale(-1)).toEqual('#0000ff');
    expect(scale(0)).toEqual('#ffffff');
    expect(scale(1)).toEqual('#ff0000');
  });
  it('handles skewed data', () => {
    const value: INumberValueTypeDesc = {
      type: 'real',
      range: [-0.1, 10]
    };
    const domain = DefaultUtils.defaultDomain(value);
    const range = DefaultUtils.defaultColor(value);
    const scale = ScaleUtils.toScale(value).domain(domain).range(range);
    expect(scale(-0.1)).toEqual('#fcfcff');
    expect(scale(0)).toEqual('#ffffff');
    expect(scale(5)).toEqual('#ff8080');
    expect(scale(10)).toEqual('#ff0000');
  });
  it('handles positive', () => {
    const value: INumberValueTypeDesc = {
      type: 'real',
      range: [0, 1]
    };
    const domain = DefaultUtils.defaultDomain(value);
    const range = DefaultUtils.defaultColor(value);
    const scale = ScaleUtils.toScale(value).domain(domain).range(range);
    expect(scale(0)).toEqual('#ffffff');
    expect(scale(0.5)).toEqual('#ff8080'); // interpolation
    expect(scale(1)).toEqual('#ff0000');
  });
  it('handles negative', () => {
    const value: INumberValueTypeDesc = {
      type: 'real',
      range: [-1, 0]
    };
    const domain = DefaultUtils.defaultDomain(value);
    const range = DefaultUtils.defaultColor(value);
    const scale = ScaleUtils.toScale(value).domain(domain).range(range);
    expect(scale(-1)).toEqual('#ffffff'); // TODO: Should be #0000ff?
    expect(scale(0)).toEqual('#ff0000'); // TODO: Should be #ffffff?
  });
});
