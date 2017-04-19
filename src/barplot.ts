/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import './style.scss';
import * as d3 from 'd3';
import {onDOMNodeRemoved, mixin} from 'phovea_core/src';
import {AVisInstance, IVisInstance, assignVis, IVisInstanceOptions} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {INumericalVector} from 'phovea_core/src/vector';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {Range} from 'phovea_core/src/range';
import {SelectOperation} from 'phovea_core/src/idtype/IIDType';
import {fire} from 'phovea_core/src/event';
import {List} from './list';
import {EOrientation} from './heatmap/internal';


export interface IBarPlotOptions extends IVisInstanceOptions {
  /**
   * @default ''
   */
  cssClass?: string;
  /**
   * @default 100
   */
  width?: number;
  /**
   * Row height
   * @default 10
   */
  rowHeight?: number;

  /**
   * @default 0
   */
  min?: number;
  /**
   * @default null
   */
  max?: number;
  /**
   * scale such that the height matches the argument
   * @default null
   */
  heightTo?: number;

  orientation?: number;
}

export class BarPlot extends AVisInstance implements IVisInstance {
  private readonly options: IBarPlotOptions = {
    cssClass: '',
    width: 100,
    rowHeight: 10,
    min: 0,
    max: NaN,
    scale: [1, 1],
    rotate: 0
  };

  private readonly $node: d3.Selection<BarPlot>;

  private labels: d3.Selection<any>;

  private xscale: d3.scale.Linear<number, number>;
  private yscale: d3.scale.Linear<number, number>;

  constructor(public readonly data: INumericalVector, parent: Element, options: IBarPlotOptions = {}) {
    super();

    this.options.heightTo = data.dim[0] * this.options.rowHeight;
    this.options.scale = [1, options.heightTo / (data.dim[0] * this.options.rowHeight) || 1];

    mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [this.options.width, this.data.dim[0] * this.options.rowHeight];
  }

  get node() {
    return <Element>this.$node.node();
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
    const color = (this.options.rowHeight * scale[1] < 10) ? '#aaa' : 'white';
    this.$node.selectAll('rect').style('stroke', color);
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    this.drawLabels();
    return act;
  }

  private build($parent: d3.Selection<any>) {
    const o = this.options,
      data = this.data;
    const width = this.rawSize[0], height = this.rawSize[1];
    const $svg = $parent.append('svg').attr({
      width: width * this.options.scale[0],
      height: height * this.options.scale[1],
      'class': 'phovea-barplot ' + o.cssClass
    });
    const $g = $svg.append('g').attr('transform', 'scale(' + this.options.scale[0] + ', ' + this.options.scale[1] + ')');

    //using range bands with an ordinal scale for uniform distribution
    const xscale = this.xscale = d3.scale.linear();
    const yscale = this.yscale = d3.scale.linear();
    const onClick = function (d, i, selectOperation) {
      data.select(0, [i], toSelectOperation(<MouseEvent>d3.event) || selectOperation);
    };

    const l = function (event, type: string, selected: Range) {
      $g.selectAll('rect').classed('phovea-select-' + type, false);
      if (selected.isNone) {
        return;
      }
      const dim0 = selected.dim(0);
      if (selected.isAll) {
        $g.selectAll('rect').classed('phovea-select-' + type, true);
      } else {
        dim0.forEach((j) => $g.selectAll('rect:nth-child(' + (j + 1) + ')').classed('phovea-select-' + type, true));
      }
    };
    data.on('select', l);
    onDOMNodeRemoved(<Element>$g.node(), () => data.off('select', l));

    data.data().then((_data) => {
      yscale.domain([0, data.length]);
      if (isNaN(o.min) || isNaN(o.max)) {
        const minmax = d3.extent(_data);
        if (isNaN(o.min)) {
          o.min = minmax[0];
        }
        if (isNaN(o.max)) {
          o.max = minmax[1];
        }
      }
      xscale.domain([o.min, o.max]).clamp(true);

      const $m = $g.selectAll('rect').data(_data);
      const binSize = width / _data.length;
      const topBottom = [-1, -1];
      $m.enter().append('rect')
        .on('mousedown', (d, i) => {
          this.data.clear();
          this.updateTopBottom(i, topBottom[1], topBottom);
        })
        .on('mouseenter', (d, i) => {
          if(topBottom[0] !== -1) {
            this.data.clear();
            this.updateTopBottom(topBottom[0], i, topBottom);
            console.log('topbottom in enter: ' + topBottom[0] + ' end: ' + topBottom[1]);
            this.selectTopBottom(topBottom, onClick);
          }
        })
        .on('mouseup', (d, i) => {
          if(topBottom[0] !== -1) {
            this.updateTopBottom(topBottom[0], i, topBottom);
            console.log('topbottom in up: ' + topBottom[0] + ' end: ' + topBottom[1]);
            this.selectTopBottom(topBottom, onClick);
            this.updateTopBottom(-1, -1, topBottom);
          }
        })
        .append('title').text(String);
      if (this.options.orientation === EOrientation.Vertical) {
        xscale.range([0, this.rawSize[0]]);
        yscale.range([0, this.rawSize[1]]);
        $m.attr({
          y: (d, i) => yscale(i),
          height: (d) => yscale(1),
          width: xscale
        });
        this.labels = $svg.append('g');
        this.drawLabels();
      } else if (this.options.orientation === EOrientation.Horizontal) {
        xscale.range([0, this.rawSize[1]]);
        yscale.range([0, this.rawSize[0]]);
        $m.attr({
          x: (d, i) => binSize * i,
          width: (d) => binSize,
          y: (d, i) => this.rawSize[1] - xscale(d),
          height: (d, i) => xscale(d)
        });

      }

      this.markReady();
      data.selections().then((selected) => l(null, 'selected', selected));
    });

    return $svg;
  }

  private selectTopBottom(topBottom: number[], onClick) {
    let start, end;
    if(topBottom[0] < topBottom[1]) {
      start = topBottom[0];
      end = topBottom[1];
     } else  {
      end = topBottom[0];
      start = topBottom[1];
    }
    for(let i = start; i <= end; i++) {
      onClick('', i);
    }
  }
  private updateTopBottom(top: number, bottom: number, topBottom: number[]) {
    topBottom[0] = top;
    topBottom[1] = bottom;
  }

  private drawLabels() {
    drawLabels(this.size, this.data, this.labels);
  }

  locateImpl(range: Range) {
    const o = this.options;
    const exI = d3.extent(range.dim(0).iter().asList());

    return this.data.data(range).then((data) => {
      const exV = d3.extent(data);
      return rect(
        this.xscale(exV[0]) / 100.0 * o.width,
        exI[0] * o.rowHeight,
        this.xscale(exV[1]) / 100.0 * o.width,
        (exI[1] + 1) * o.rowHeight
      );
    });
  }
}
export default BarPlot;

export function create(data: INumericalVector, parent: Element, options?: IBarPlotOptions) {
  return new BarPlot(data, parent, options);
}

/**
 * Draw labels for given data
 * @param size array with [width, height]
 * @param data loaded data set
 * @param labels D3 Elements with all labels
 */
export function drawLabels(size:number[], data:INumericalVector, labels: d3.Selection<any>) {
  const rowHeight = size[1] / data.dim[0];
  labels.attr({
    'display': (rowHeight >= 15) ? 'inline' : 'none',
    'font-size': '14px'
  });
  data.data().then((_data) => {
    const $n = labels.selectAll('text').data(_data);
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
