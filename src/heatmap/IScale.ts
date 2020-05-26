import * as d3 from 'd3';
import {VALUE_TYPE_CATEGORICAL} from 'phovea_core';

export interface IScale {
  (x: any): any;
  domain(): any[];
  domain(values: any[]): IScale;

  range(): any[];
  range(values: any[]): IScale;
}

export function toScale(value): IScale {
  if (value.type === VALUE_TYPE_CATEGORICAL) {
    return d3.scale.ordinal();
  }
  return d3.scale.linear();
}
