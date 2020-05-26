/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import '../style.scss';
import {scale} from 'd3';
import {BaseUtils} from 'phovea_core';
import {INumericalVector} from 'phovea_core';
import {AList, IAListOptions} from './internal/AList';
import {INumberValueTypeDesc} from 'phovea_core';

export interface IBarPlotOptions extends IAListOptions {
  min?: number;
  max?: number;
}

export class BarPlot extends AList<number, INumberValueTypeDesc, IBarPlotOptions> {
  private readonly scale = scale.linear<number,number>();

  constructor(data: INumericalVector, parent: HTMLElement, options: IBarPlotOptions = {}) {
    super(data, parent, BaseUtils.mixin({cssClass: 'phovea-barplot', width: 100, min: NaN, max: NaN}, options));
    this.build();
  }

  private get maxBarWidth() {
    const scale = this.options.scale;
    return scale[0] * this.options.width;
  }

  private get domain() {
    const r = this.data.valuetype.range;
    return [!isNaN(this.options.min) ? this.options.min : r[0], !isNaN(this.options.max) ? this.options.max : r[1]];
  }

  protected render($enter: d3.Selection<number>, $update: d3.Selection<number>) {
    this.scale.range([0, this.maxBarWidth]);
    const scale = this.options.scale;
    $update.attr('title', (d) => String(d));
    $update.style('width', (d) => this.scale(d) + 'px');
  }

  protected build() {
    this.scale.domain(this.domain).range([0, this.maxBarWidth]);
    return super.build();
  }


  static createBarPlot(data: INumericalVector, parent: HTMLElement, options: IBarPlotOptions) {
    return new BarPlot(data, parent, options);
  }
}

