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
import {defaultColor, defaultDomain, toScale, IScale, ICommonHeatMapOptions, EOrientation} from './internal';
import {SelectOperation} from 'phovea_core/src/idtype/IIDType';
import {fire} from 'phovea_core/src/event';
import List from '../list';
import {drawLabels} from '../barplot';
import {toSelectOperation} from 'phovea_core/src/idtype';

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

  orientation?: number;
}


export declare type IHeatMapAbleVector = INumericalVector|ICategoricalVector;

export default class HeatMap1D extends AVisInstance implements IVisInstance {

  private $node: d3.Selection<any>;
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
    this.options.orientation = options.orientation;
    mixin(this.options, {
      color: defaultColor(value),
      domain: defaultDomain(value)
    }, options);
    this.options.scale = [1, (this.options.heightTo / (data.dim[0])) || 10];
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);
    const pr = this.build(d3.select(parent));
    pr.then((node) => {
      this.$node = node;
      this.$node.datum(data);
      assignVis(this.node, this);
    });
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
    const strokeWidth = (height * scale[1] / this.data.dim[0] < 10) ? '0' : '0.1';
    this.$node.selectAll('rect').style('stroke-width', strokeWidth);
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

  private async build($parent: d3.Selection<any>) {
    const width = this.options.width, height = this.rawSize[1];
    const selection = new Selection();

    const $svg = $parent.append('svg').attr({
      width,
      height: height * this.options.scale[1],
      'class': 'phovea-heatmap'
    });
    const $g = $svg.append('g').attr('transform', 'scale(1,' + this.options.scale[1] + ')');

    const c = this.colorer;
    const t = <Promise<string|number[]>>this.data.data();
    t.then((arr: any[]) => {
      const topBottom = [-1, -1];
      const binSize = width / arr.length;
      const $rows = $g.selectAll('rect').data(arr);
      const onClick = selectionUtil(this.data, $g, 'rect', SelectOperation.ADD);
      const r = $rows.enter().append('rect');
      this.data.selections().then((sel) => {
        r.on('mousedown', (d, i) => {
          if (toSelectOperation(<MouseEvent>d3.event) === SelectOperation.SET) {
            this.data.clear();
            fire(List.EVENT_BRUSH_CLEAR, this.data);
            selection.createArea();
            selection.updateLatestArea(i, null);
          }
        })
        .on('mouseenter', (d, i) => {
          if(selection.selectionStarted()) {
            this.data.clear();
            selection.updateLatestArea(null, i);
            selection.selectLatestArea(onClick);
          }
        })
        .on('mouseup', (d, i) => {
          if(selection.selectionStarted()) {
            selection.updateLatestArea(null, i);
            selection.selectLatestArea(onClick);
            const area = selection.latestArea().toArray();
            area.sort((a, b) => a - b);
            fire(List.EVENT_BRUSHING, area, this.data);
            //remove old areas
            selection.deleteOldAreas();
          }
        })
        .append('title').text(String);
      });
      $rows.attr({
        fill: (d) => c(d)
      });
      if (this.options.orientation === EOrientation.Vertical) {
        $rows.attr({
          y: (d, i) => i,
          width: this.options.width,
          height: 1
        });
        this.labels = $svg.append('g');
        this.drawLabels();
      } else if (this.options.orientation === EOrientation.Horizontal) {
        $rows.attr({
          x: (d, i) => i * binSize,
          width: binSize,
          height: this.options.heightTo
        });
      }
      $rows.exit().remove();
      this.markReady();
    });
    return $svg;
  }
  private selectTopBottom(topBottom: number[], onClick) {
    const copy = topBottom.slice();
    copy.sort((a, b) => a - b);
    for(let i = copy[0]; i <= copy[1]; i++) {
      onClick('', i);
    }
  }
  private drawLabels() {
    drawLabels(this.size, <INumericalVector>this.data, this.labels);
  }
}

class Selection {
  selectionAreas : SelectionArea[];
  constructor() {
    this.selectionAreas = [];
  }
  initialize(x) {
    console.log(x);
    }
  createArea() {
    const s = new SelectionArea();
    this.selectionAreas.push(s);
    this.resetLatestArea();
  }
  resetLatestArea() {
    this.updateLatestArea(-1, -1);
  }
  latestArea() {
    if(this.selectionAreas.length === 0)
      return null;
    return this.selectionAreas[this.selectionAreas.length - 1];
  }
  updateLatestArea(start: number, end : number) {
    if(this.selectionAreas.length === 0) {
      return;
      }
    const lastArea = this.latestArea();
    if(start != null) {
      lastArea.start = start;
    }
    if(end != null) {
      lastArea.end = end;
    }
    console.log('Area has new value: ' + lastArea.start + ' ' + lastArea.end);
  }
  selectLatestArea(onClick) {
    const copy = this.latestArea().toArray();
    copy.sort((a, b) => a - b);
    for(let i = copy[0]; i <= copy[1]; i++) {
      onClick('', i);
    }
  }
  deleteOldAreas() {
    this.selectionAreas = this.selectionAreas.slice(-1);
  }
  selectionStarted() {
    return this.selectionAreas.length !== 0 && this.latestArea().start !== -1;
  }
}

class SelectionArea {
  start: number;
  end: number;
  toArray() {
    return [this.start, this.end];
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
