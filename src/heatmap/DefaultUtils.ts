/**
 * Created by Samuel Gratzl on 26.12.2016.
 */

import {
  ValueTypeUtils, INumberValueTypeDesc,
  ICategoricalValueTypeDesc, ICategory
} from 'tdp_core';

export class DefaultUtils {

  static defaultColor(value: INumberValueTypeDesc|ICategoricalValueTypeDesc): string[] {
    if (value.type === ValueTypeUtils.VALUE_TYPE_CATEGORICAL) {
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

  static defaultDomain(value: INumberValueTypeDesc|ICategoricalValueTypeDesc): (string|number)[] {
    if (value.type === ValueTypeUtils.VALUE_TYPE_CATEGORICAL) {
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

  static isMissing(v: any) {
    return (v === null || (typeof v === 'number' && isNaN(v)));
  }
}
