/**
 * Created by Samuel Gratzl on 26.01.2016.
 */

import './style.scss';
import * as d3 from 'd3';
import {onDOMNodeRemoved, mixin} from 'phovea_core/src';
import {Range} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis, ITransform} from 'phovea_core/src/vis';
import {IHistAbleDataType} from 'phovea_core/src/datatype';
import {IStratification} from 'phovea_core/src/stratification';
import {IHistogram} from 'phovea_core/src/math';
import {toSelectOperation} from 'phovea_core/src/idtype';
import bindTooltip from 'phovea_d3/src/tooltip';
import {createHistData, IDistributionOptions, IHistData, ITotalHeight, resolveHistMax} from './utils';

export interface IHistogramOptions extends IDistributionOptions {
  /**
   * options to specify how the total value is computed
   * @default true
   */
  total?: ITotalHeight;

  /**
   * @default Math.floor(Math.sqrt(data.length))
   */
  nbins?: number;

  /**
   * @default 200
   */
  duration?: number;
}

export default class Histogram extends AVisInstance implements IVisInstance {
  private options: IHistogramOptions = {
    nbins: 5,
    total: true,
    duration: 200,
    scale: [1, 1],
    rotate: 0
  };

  private readonly $node: d3.Selection<Histogram>;

  private xscale: d3.scale.Ordinal<number, number>;
  private yscale: d3.scale.Linear<number, number>;

  private hist: IHistogram;
  private hist_data: IHistData[];

  constructor(public readonly data: IHistAbleDataType|IStratification, parent: Element, options: IHistogramOptions = {}) {
    super();
    mixin(this.options, {
      nbins: Math.floor(Math.sqrt(data.length)),
    }, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [200, 100];
  }

  get node() {
    return <SVGSVGElement>this.$node.node();
  }

  private build($parent: d3.Selection<any>) {
    const size = this.size,
      data = this.data,
      o = this.options;

    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-histogram'
    });
    const $t = $svg.append('g');
    const $data = $t.append('g');
    const $highlight = $t.append('g').style('pointer-events', 'none').classed('phovea-select-selected', true);

    //using range bands with an ordinal scale for uniform distribution
    const xscale = this.xscale = d3.scale.ordinal<number,number>().rangeBands([0, size[0]], 0.1);
    const yscale = this.yscale = d3.scale.linear().range([0, size[1]]);

    const l = (event: any, type: string, selected: Range) => {
      if (!this.hist_data) {
        return;
      }
      const highlights = this.hist_data.map((entry, i) => {
        const s = entry.range.intersect(selected);
        return {
          i: i,
          v: s.size()[0]
        };
      }).filter((entry) => entry.v > 0);
      const $m = $highlight.selectAll('rect').data(highlights);
      $m.enter().append('rect').attr('width', xscale.rangeBand());
      $m.attr({
        x: function (d) {
          return xscale(d.i);
        },
        y: function (d) {
          return yscale(yscale.domain()[1] - d.v);
        },
        height: 0
      });
      $m.transition().duration(o.duration).attr('height', function (d) {
        return yscale(d.v);
      });
      $m.exit().remove();
    };
    data.on('select', l);
    onDOMNodeRemoved(<Element>$data.node(), function () {
      data.off('select', l);
    });

    const onClick = (d) => data.select(0, d.range, toSelectOperation(d3.event));

    this.data.hist(Math.floor(o.nbins)).then((hist) => {
      this.hist = hist;
      xscale.domain(d3.range(hist.bins));
      return resolveHistMax(hist, this.options.total);
    }).then((hist_max) => {
      const hist = this.hist;
      yscale.domain([0, hist_max]);
      const hist_data = this.hist_data = createHistData(hist, this.data);

      const $m = $data.selectAll('rect').data(hist_data);
      $m.enter().append('rect')
        .attr('width', xscale.rangeBand())
        .call(bindTooltip<IHistData>((d) => `${d.name} ${d.v} entries (${Math.round(d.ratio * 100)}%)`))
        .on('click', onClick);
      $m.attr({
        x: (d, i) => xscale(i),
        fill: (d) => d.color,
        y: (d) => yscale(yscale.domain()[1] - d.v),
        height: (d) => yscale(d.v)
      });
      this.markReady();
      data.selections().then((selected) => {
        l(null, 'selected', selected);
      });
    });

    return $svg;
  }

  locateImpl(range: Range) {
    const size = this.rawSize;
    if (range.isAll || range.isNone) {
      return Promise.resolve({x: 0, y: 0, w: size[0], h: size[1]});
    }
    return (<any>this.data).data(range).then((data) => {
      const ex = d3.extent(data, (value) => this.hist.binOf(value));
      const h0 = this.hist_data[ex[0]];
      const h1 = this.hist_data[ex[1]];
      return Promise.resolve({
        x: this.xscale(ex[0]),
        width: (this.xscale(ex[1]) - this.xscale(ex[0]) + this.xscale.rangeBand()),
        height: this.yscale(Math.max(h0.v, h1.v)),
        y: this.yscale(this.yscale.domain()[1] - Math.max(h0.v, h1.v))
      });
    });
  }

  transform(scale?: [number, number], rotate?: number): ITransform {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    const size = this.rawSize;
    this.$node.attr({
      width: size[0] * scale[0],
      height: size[1] * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');

    const new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform', new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }
}


export function create(data: IHistAbleDataType|IStratification, parent: Element, options?: IHistogramOptions) {
  return new Histogram(data, parent, options);
}
