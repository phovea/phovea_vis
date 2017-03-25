/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import './style.scss';
import * as d3 from 'd3';
import {Range} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis, IVisInstanceOptions} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {mixin} from 'phovea_core/src';
import {INumericalVector} from 'phovea_core/src/vector';
import bindTooltip from 'phovea_d3/src/tooltip';

export interface IBoxPlotOptions extends IVisInstanceOptions {
  /**
   * width
   * @default 300
   */
  width?: number;
  /**
   * scale such that the height matches the argument
   * @default 50
   */
  heightTo?: number;
}


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
    width: 300,
    heightTo: 50,
    scale: [1, 1],
    rotate: 0
  };

  private readonly $node: d3.Selection<BoxPlot>;

  private scale: d3.scale.Linear<number, number>;

  constructor(public data: INumericalVector, parent: Element, options: IBoxPlotOptions = {}) {
    super();
    this.options.scale = [options.width / this.rawSize[0] || 1, options.heightTo / this.rawSize[1] || 1];
    mixin(this.options, options);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [300, 50];
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

    this.$node.attr({
      width: this.rawSize[0] * scale[0],
      height: this.rawSize[1] * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }


  private build($parent: d3.Selection<any>) {
    const size = this.size,
      data = this.data;
    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'viewBox': '0 0 '+ this.rawSize[0] + ' ' + this.rawSize[1],
      'preserveAspectRatio': 'xMidMid meet',
      'class': 'phovea-box'
    });

    const edgeOffset = 4;
    const $t = $svg.append('g');
    const s = this.scale = d3.scale.linear().domain((<any>this.data.desc).value.range).range([edgeOffset, this.rawSize[0] - edgeOffset]).clamp(true);

    $t.append('path').attr({
      d: 'M&,0 L&,$ M&,§ L%,§ M%,0 L%,$'.replace(/\&/g,String(edgeOffset)).replace(/\%/g, String(this.rawSize[0] - edgeOffset)).replace(/\$/g, String(this.rawSize[1])).replace(/\§/g, String(this.rawSize[1] / 2)),
      'class': 'axis'
    });
    data.statsAdvanced().then((stats) => {
      const text = createText(stats);

      $t.append('rect').attr({
        x: s(stats.q1),
        y: 0,
        width: s(stats.q3),
        height: this.rawSize[1],
        'class': 'box'
      }).call(bindTooltip(text));

      $t.append('line').attr({
        x1: s(stats.median),
        x2: s(stats.median),
        y1: 0,
        y2: this.rawSize[1],
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
      return Promise.resolve(rect(r[0], 0, r[1] - r[0], 50));
    }
    return this.data.data(range).then(function (data) {
      const ex = d3.extent(data, that.scale);
      return rect(ex[0], 0, ex[1] - ex[0], 50);
    });
  }
}
export default BoxPlot;

export function create(data: INumericalVector, parent: Element, options?: IBoxPlotOptions) {
  return new BoxPlot(data, parent, options);
}
