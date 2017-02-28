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
  const keys = ['min', 'max', 'sum', 'mean', 'var', 'sd', 'n', 'nans', 'moment2', 'moment3', 'moment4', 'kurtosis', 'skewness'];
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
    mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [this.options.width || 300, this.options.heightTo || 50];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent: d3.Selection<any>) {
    const size = [this.options.width,this.options.heightTo],
      data = this.data;
    const $svg = $parent.append('svg').attr({
      width: this.options.width,
      height: this.options.heightTo,
      'class': 'phovea-box'
    });

    let height = (this.options.width/5 >= 20) ? (this.options.width/5) : 20;
    height = (height > this.options.heightTo) ? this.options.heightTo : height;


    const $t = $svg.append('g');
    const s = this.scale = d3.scale.linear().domain((<any>this.data.desc).value.range).range([0.1*size[0], 0.9*size[0]]).clamp(true);

    $t.append('path').attr({
      d: 'M&,@ L&,$ M&,§ L%,§ M%,@ L%,$'.replace(/\&/g,String( 0.1*size[0])).replace(/\%/g, String(0.9*size[0])).replace(/\$/g, String(size[1]/2+ height/2)).replace(/\§/g, String(size[1] / 2)).replace(/\@/g, String(size[1]/2 - height/2)),
      'class': 'axis'
    });
    data.stats().then((stats) => {
      const text = createText(stats);

      $t.append('rect').attr({
        x: s(stats.mean - stats.sd),
        y: size[1]/2 - height/2,
        width: s(stats.sd * 2),
        height,
        'class': 'box'
      }).call(bindTooltip(text));

      $t.append('line').attr({
        x1: s(stats.mean),
        x2: s(stats.mean),
        y1: size[1]/2 - height/2,
        y2: size[1]/2 + height/2,
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
