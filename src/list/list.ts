/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import '../style.scss';
import {format} from 'd3';
import {mixin} from 'phovea_core/src';
import {IAnyVector} from 'phovea_core/src/vector';
import AList, {IAListOptions} from './internal/AList';
import {IValueTypeDesc} from 'phovea_core/src/datatype';

export interface IListOptions extends IAListOptions {
  format?: string;
}

export class List extends AList<any, IValueTypeDesc, IListOptions> {
  constructor(data: IAnyVector, parent: HTMLElement, options: IListOptions = {}) {
    super(data, parent, mixin({format: null, rowHeight: 18}, options));
    this.build();
  }

  protected render($enter: d3.Selection<any>, $update: d3.Selection<any>) {
    const formatter = this.options.format ? format(this.options.format) : String;
    const factor = this.options.scale[1];
    $update.style('font-size', (factor >= 1 ? null : Math.round(factor * 100) + '%'));
    $update.text(formatter);
  }
}

export default List;

export function createList(data: IAnyVector, parent: HTMLElement, options: IListOptions) {
  return new List(data, parent, options);
}
