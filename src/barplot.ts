/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import './style.scss';
import * as d3 from 'd3';
import {onDOMNodeRemoved, mixin} from 'phovea_core/src';
import {AVisInstance, IVisInstance, assignVis, IVisInstanceOptions} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {IVector} from 'phovea_core/src/vector';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {Range} from 'phovea_core/src/range';


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
   * @default 10
   */
  heighti?: number;

  /**
   * @default 0
   */
  min?: number;
  /**
   * @default NaN
   */
  max?: number;
}

export class BarPlot extends AVisInstance implements IVisInstance {
  private readonly options: IBarPlotOptions = {
    cssClass: '',
    width: 100,
    heighti: 10,
    min: 0,
    max: NaN,
    scale: [1, 1],
    rotate: 0
  };

  private readonly $node: d3.Selection<BarPlot>;

  private xscale: d3.scale.Linear<number, number>;
  private yscale: d3.scale.Linear<number, number>;

  constructor(public readonly data: IVector, parent: Element, options: IBarPlotOptions = {}) {
    super();
    mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [this.options.width, this.data.dim[0] * this.options.heighti];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent: d3.Selection<any>) {
    const o = this.options,
      size = this.size,
      data = this.data;
    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-barplot ' + o.cssClass
    });

    //using range bands with an ordinal scale for uniform distribution
    const xscale = this.xscale = d3.scale.linear().range([0, 100]);
    const yscale = this.yscale = d3.scale.linear().range([0, 100]);

    const onClick = function (d, i) {
      data.select(0, [i], toSelectOperation(d3.event));
    };

    const l = function (event, type: string, selected: Range) {
      $svg.selectAll('rect').classed('phovea-select-' + type, false);
      if (selected.isNone) {
        return;
      }
      const dim0 = selected.dim(0);
      if (selected.isAll) {
        $svg.selectAll('rect').classed('phovea-select-' + type, true);
      } else {
        dim0.forEach((j) => $svg.selectAll('rect:nth-child(' + (j + 1) + ')').classed('phovea-select-' + type, true));
      }
    };
    data.on('select', l);
    onDOMNodeRemoved(<Element>$svg.node(), () => data.off('select', l));

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
      xscale.domain([o.min, o.max]);

      const $m = $svg.selectAll('rect').data(_data);
      $m.enter().append('rect')
        .on('click', onClick);
      $m.attr({
        y: (d, i) => yscale(i),
        height: (d) => yscale(1),
        width: xscale
      });
      this.markReady();
      data.selections().then((selected) => l(null, 'selected', selected));
    });

    return $svg;
  }

  locateImpl(range: Range) {
    const o = this.options;
    const ex_i = d3.extent(range.dim(0).iter().asList());

    return this.data.data(range).then((data) => {
      const ex_v = d3.extent(data);
      return rect(
        this.xscale(ex_v[0]) / 100.0 * o.width,
        ex_i[0] * o.heighti,
        this.xscale(ex_v[1]) / 100.0 * o.width,
        (ex_i[1] + 1) * o.heighti
      );
    });
  }
}
export default BarPlot;

export function create(data: IVector, parent: Element, options?: IBarPlotOptions) {
  return new BarPlot(data, parent, options);
}
