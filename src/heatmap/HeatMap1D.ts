/**
 * Created by Samuel Gratzl on 26.12.2016.
 */

import '../style.scss';
import * as d3 from 'd3';
import {Range} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {mixin} from 'phovea_core/src';
import {selectionUtil} from 'phovea_d3/src/d3util';
import {INumericalVector, ICategoricalVector} from 'phovea_core/src/vector';
import {defaultColor, defaultDomain, toScale, IScale, ICommonHeatMapOptions} from './internal';
import {SelectOperation} from 'phovea_core/src/idtype/IIDType';
import {fire} from 'phovea_core/src/event';
import List from '../list';

export interface IHeatMap1DOptions extends ICommonHeatMapOptions {
  /**
   * width
   * @default 20
   */
  width?: number;
  /**
   * scale such that the height matches the argument
   * @default null
   */
  heightTo?: number;
}

export declare type IHeatMapAbleVector = INumericalVector|ICategoricalVector;

export default class HeatMap1D extends AVisInstance implements IVisInstance {
  private readonly $node: d3.Selection<any>;
  private labels: d3.Selection<any>;
  private readonly colorer: IScale;

  private readonly options: IHeatMap1DOptions = {
    width: 20,
    scale: [1, 1],
    rotate: 0
  };

  constructor(public readonly data: IHeatMapAbleVector, public parent: Element, options: IHeatMap1DOptions = {}) {
    super();
    const value = this.data.valuetype;
    this.options.heightTo = data.dim[0];
    mixin(this.options, {
      color: defaultColor(value),
      domain: defaultDomain(value)
    }, options);
    this.options.scale = [1, (this.options.heightTo / (data.dim[0])) || 10];
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    const d = this.data.dim;
    return [this.options.width, d[0]];
  }

  get node() {
    return <Element>this.$node.node();
  }

  option(name: string, val?: any) {
    if (arguments.length === 1) {
      return this.options[name];
    } else {
      this.fire('option', name, val, this.options[name]);
      this.fire('option.' + name, val, this.options[name]);
      this.options[name] = val;
      switch (name) {
        case 'color':
        case 'domain':
          this.recolor();
          break;
      }
    }
  }

  locateImpl(range: Range) {
    const dims = this.data.dim;
    const height = dims[0];

    function l(r, max, s) {
      if (r.isAll || r.isNone) {
        return [0, max * s];
      }
      const ex: any = d3.extent(r.asList());
      return [ex[0] * s, (ex[1] - ex[0] + 1) * s];
    }

    const yh = l(range.dim(0), height, this.options.scale[1]);
    return Promise.resolve(rect(0, yh[0], 20, yh[1]));
  }

  transform(scale?: [number, number], rotate: number = 0) {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    const width = this.options.width, height = this.rawSize[1];
    this.$node.attr({
      width: width * scale[0],
      height: height * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    this.drawLabels();
    return act;
  }

  private recolor() {
    const c = this.colorer;
    c.domain(this.options.domain).range(this.options.color);
    this.$node.selectAll('rect').attr('fill', (d) => c(d));
  }

  private build($parent: d3.Selection<any>) {
    const width = this.options.width, height = this.rawSize[1];
    const $svg = $parent.append('svg').attr({
      width,
      height: height * this.options.scale[1],
      'class': 'phovea-heatmap'
    });
    const $g = $svg.append('g').attr('transform', 'scale(1,' + this.options.scale[1] + ')');

    const c = this.colorer;

    const t = <Promise<string|number[]>>this.data.data();
    t.then((arr: any[]) => {
      let start = null;
      const $rows = $g.selectAll('rect').data(arr);
      const onClick = selectionUtil(this.data, $g, 'rect', SelectOperation.ADD);
      $rows.enter().append('rect')
        .on('mousedown', (d, i) => {
          if(start !== null) {
            return;
          }

          start = {d, i, applied: false};
        })
        .on('mouseenter', (d, i) => {
          if (start === null) {
            return;
          }

          onClick(d, i); // select current entered element

          // select first element, when started brushing
          if(start.applied === false) {
            onClick(start.d, start.i);
            start.applied = true;
          }
        })
        .on('mouseup', (d, i) => {
          if (start === null) {
            return;
          }

          // select as click
          if(start.applied === false) {
            onClick(start.d, start.i);
          }

          fire(List.EVENT_BRUSHING, [start.i, i], this.data);

          start = null;
        })
        .attr({
          width: this.options.width,
          height: 1
        }).append('title').text(String);
      $rows.attr({
        fill: (d) => c(d),
        y: (d, i) => i
      });
      $rows.exit().remove();

      this.labels = $svg.append('g');
      this.drawLabels();
      this.markReady();
    });
    return $svg;
  }

  private drawLabels() {
    const rowHeight = this.size[1] / this.data.dim[0];
    this.labels.attr({
      'display': (rowHeight >= 10) ? 'inline' : 'none',
      'font-size': (3 / 4 * rowHeight) + 'px'
    });
    const t = <Promise<string|number[]>>this.data.data();
    t.then((arr: any[]) => {
      const $n = this.labels.selectAll('text').data(arr);
      $n.enter().append('text');
      const yPadding = 2;
      const xPadding = 3;
      $n.attr({
        'alignment-baseline': 'central',
        x: xPadding,
        y: (d, i) => (i + 0.5) * rowHeight,
        height: (d) => rowHeight - yPadding
      }).text(String);
    });
  }
}


export function create(data: IHeatMapAbleVector, parent: HTMLElement, options?: IHeatMap1DOptions): AVisInstance {
  return new HeatMap1D(data, parent, options);
}

export function filterCat(aVal, bval) {
  //if (aVal === bval) {
  return aVal === bval; //Also include undefined empty strings and null values.
  // }
}
