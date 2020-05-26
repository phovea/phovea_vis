/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import '../style.scss';
import {scale} from 'd3';
import {mixin} from 'phovea_core';
import {INumericalVector} from 'phovea_core';
import {AList, IAListOptions} from './internal/AList';
import {INumberValueTypeDesc} from 'phovea_core';

export interface IProportionalSymbolOptions extends IAListOptions {
  min?: number;
  max?: number;
}

export class ProportionalSymbol extends AList<number, INumberValueTypeDesc, IProportionalSymbolOptions> {
  private readonly scale = scale.linear<number,number>();

  constructor(data: INumericalVector, parent: HTMLElement, options: IProportionalSymbolOptions = {}) {
    super(data, parent, mixin({cssClass: 'phovea-proportional-symbol', width: 20, min: NaN, max: NaN}, options));
    this.build();
  }

  private get maxDiameter() {
    const scale = this.options.scale;
    const w = scale[0] * this.options.width;
    const h = scale[1] * this.options.rowHeight;
    return Math.min(w, h);
  }

  private get domain() {
    const r = this.data.valuetype.range;
    return [!isNaN(this.options.min) ? this.options.min : r[0], !isNaN(this.options.max) ? this.options.max : r[1]];
  }

  protected render($enter: d3.Selection<number>, $update: d3.Selection<number>) {
    this.scale.range([0, this.maxDiameter]);
    $update.attr('title', (d) => String(d));
    $update.style('width', (d) => this.scale(d) + 'px');
    $update.style('height', (d) => this.scale(d) + 'px');
  }

  protected build() {
    this.scale.domain(this.domain).range([0, this.maxDiameter]);
    return super.build();
  }

  static createProportionalSymbol(data: INumericalVector, parent: HTMLElement, options: IProportionalSymbolOptions) {
    return new ProportionalSymbol(data, parent, options);
  }
}
