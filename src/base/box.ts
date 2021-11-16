/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import * as d3 from 'd3';
import {Range} from 'tdp_core';
import {AVisInstance, IVisInstance, VisUtils, IVisInstanceOptions} from 'tdp_core';
import {Rect} from 'tdp_core';
import {BaseUtils} from 'tdp_core';
import {INumericalVector} from 'tdp_core';
import {ToolTip} from 'phovea_d3';


export declare type IBoxPlotOptions = IVisInstanceOptions;

function createText(stats) {
  let r = '<table><tbody>';
  const keys = ['min', 'max', 'sum', 'mean', 'median', 'q1', 'q3', 'var', 'sd', 'n', 'nans', 'moment2', 'moment3', 'moment4', 'kurtosis', 'skewness'];
  keys.forEach(function (key) {
    const value = stats[key];
    r = `${r}<tr><td>${key}</td><td>${value}</td></tr>`;
  });
  r = `${r}</tbody></table>`;
  return r;
}

export class BoxPlot extends AVisInstance implements IVisInstance {
  private readonly options: IBoxPlotOptions = {
    scale: [1, 1],
    rotate: 0
  };

  private readonly $node: d3.Selection<BoxPlot>;

  private scale: d3.scale.Linear<number, number>;

  constructor(public data: INumericalVector, parent: Element, options: IBoxPlotOptions = {}) {
    super();
    BaseUtils.mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    VisUtils.assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [300, 50];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent: d3.Selection<any>) {
    const size = this.size,
      data = this.data;
    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-box'
    });

    const $t = $svg.append('g');

    const s = this.scale = d3.scale.linear().domain((<any>this.data.desc).value.range).range([0, size[0]]).clamp(true);

    $t.append('path').attr({
      d: `M0,0 L0,${size[1]} M0,${size[1] / 2} L${size[0]},${size[1] / 2} M${size[0]},0 L${size[0]},${size[1]}`,
      'class': 'axis'
    });
    data.statsAdvanced().then((stats) => {
      const text = createText(stats);

      $t.append('rect').attr({
        x: s(stats.q1),
        y: '10%',
        width: s(stats.q3),
        height: '80%',
        'class': 'box'
      }).call(ToolTip.bind(text));

      $t.append('line').attr({
        x1: s(stats.median),
        x2: s(stats.median),
        y1: '10%',
        y2: '90%',
        'class': 'mean'
      });
      this.markReady();
    });

    return $svg;
  }

  locateImpl(range: Range) {
    const that = this;
    if (range.isAll || range.isNone) {
      const r = this.scale.range();
      return Promise.resolve(Rect.rect(r[0], 0, r[1] - r[0], 50));
    }
    return this.data.data(range).then(function (data) {
      const ex = d3.extent(data, that.scale);
      return Rect.rect(ex[0], 0, ex[1] - ex[0], 50);
    });
  }

  static createBoxPlot(data: INumericalVector, parent: Element, options?: IBoxPlotOptions) {
    return new BoxPlot(data, parent, options);
  }
}
