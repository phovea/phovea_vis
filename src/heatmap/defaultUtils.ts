/**
 * Created by Samuel Gratzl on 26.12.2016.
 */

import {
  VALUE_TYPE_CATEGORICAL, INumberValueTypeDesc,
  ICategoricalValueTypeDesc, ICategory
} from 'phovea_core/src/datatype';


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

export function isMissing(v: any) {
  return (v === null || (typeof v === 'number' && isNaN(v)));
}
