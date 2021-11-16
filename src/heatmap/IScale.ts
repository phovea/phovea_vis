import * as d3 from 'd3';
import {ValueTypeUtils} from 'tdp_core';

export interface IScale {
  (x: any): any;
  domain(): any[];
  domain(values: any[]): IScale;

  range(): any[];
  range(values: any[]): IScale;
}

export class ScaleUtils {
  static toScale(value): IScale {
    if (value.type === ValueTypeUtils.VALUE_TYPE_CATEGORICAL) {
      return d3.scale.ordinal();
    }
    return d3.scale.linear();
  }
}
