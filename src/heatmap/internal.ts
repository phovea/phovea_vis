/**
 * Created by Samuel Gratzl on 26.12.2016.
 */

import * as d3 from 'd3';
import {
  IValueTypeDesc, VALUE_TYPE_CATEGORICAL, INumberValueTypeDesc,
  ICategoricalValueTypeDesc, ICategory
} from 'phovea_core/src/datatype';
import {IVisInstanceOptions} from 'phovea_core/src/vis';
export {isMissing} from '../utils';

export enum EOrientation {
  Vertical,
  Horizontal
}


export function defaultColor(value: INumberValueTypeDesc|ICategoricalValueTypeDesc): string[] {
  if (value.type === VALUE_TYPE_CATEGORICAL) {
    return (<ICategoricalValueTypeDesc>value).categories.map((c) => typeof c === 'string' ? 'gray' : (<ICategory>c).color || 'gray');
  }
  const nv = <INumberValueTypeDesc>value;
  const r = nv.range;
  if (r[0] < 0 && r[1] > 0) {
    //use a symmetric range
    return ['blue', 'white', 'red'];
  }
  return ['white', 'red'];
}
export function defaultDomain(value: INumberValueTypeDesc|ICategoricalValueTypeDesc): (string|number)[] {
  if (value.type === VALUE_TYPE_CATEGORICAL) {
    return (<ICategoricalValueTypeDesc>value).categories.map((c) => typeof c === 'string' ? <string>c : (<ICategory>c).name);
  }
  const nv = <INumberValueTypeDesc>value;
  const r = nv.range;
  if (r[0] < 0 && r[1] > 0) {
    //use a symmetric range
    return [Math.min(r[0], -r[1]), 0, Math.max(-r[0], r[1])];
  }
  return r;
}

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


export interface ICommonHeatMapOptions extends IVisInstanceOptions {
  /**
   * @default 10
   */
  initialScale?: number;
  /**
   * @default derived from value
   */
  color?: string[];
  /**
   * @default derived from value
   */
  domain?: (number|string)[];

  /**
   * missing value color
   * @default magenta
   */
  missingColor?: string;
}
