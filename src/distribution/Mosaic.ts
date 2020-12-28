/**
 * Created by Samuel Gratzl on 26.01.2016.
 */

import * as d3 from 'd3';
import {AppContext, BaseUtils} from 'phovea_core';
import {Range} from 'phovea_core';
import {AVisInstance, IVisInstance, VisUtils, ITransform} from 'phovea_core';
import {IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc} from 'phovea_core';
import {IStratification} from 'phovea_core';
import {IHistogram} from 'phovea_core';
import {SelectionUtils} from 'phovea_core';
import {ToolTip} from 'phovea_d3';
import {HistUtils, IDistributionOptions, IHistData} from './HistData';


export interface IMosaicOptions extends IDistributionOptions {
  /**
   * @default 20
   */
  width?: number;
  /**
   * @default 200
   */
  duration?: number;
  /**
   * target height such that the mosaic will fit
   * @default null
   */
  heightTo?: number;
  /**
   * @default 10
   */
  initialScale?: number;
  /**
   * @default true
   */
  selectAble?: boolean;
}

export class Mosaic extends AVisInstance implements IVisInstance {
  private readonly options: IMosaicOptions = {
    width: 20,
    initialScale: 10,
    duration: 200,
    heightTo: null,
    selectAble: true,
    scale: [1, 1],
    rotate: 0
  };

  private readonly $node: d3.Selection<Mosaic>;

  private hist: IHistogram;
  private histData: IHistData[];

  constructor(public readonly data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification, parent: Element, options: IMosaicOptions = {}) {
    super();
    BaseUtils.mixin(this.options, {
      scale: [1, this.options.initialScale]
    }, options);

    if (typeof this.options.heightTo === 'number') {
      this.options.scale[1] = this.options.heightTo / this.data.dim[0];
    }

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    VisUtils.assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [this.options.width, this.data.dim[0]];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent: d3.Selection<any>) {
    const size = this.size,
      data = this.data,
      o = this.options;

    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-mosaic'
    });
    const $scale = $svg.append('g').attr('transform', 'scale(' + o.scale[0] + ',' + o.scale[1] + ')');
    const $data = $scale.append('g');
    const $highlight = $scale.append('g').style('pointer-events', 'none').classed('phovea-select-selected', true);

    const l = (event: any, type: string, selected: Range) => {
      if (!this.histData) {
        return;
      }
      const highlights = this.histData.map((entry, i) => {
        const s = entry.range.intersect(selected);
        return {
          i,
          acc: entry.acc,
          v: s.size()[0]
        };
      }).filter((entry) => entry.v > 0);
      const $m = $highlight.selectAll('rect').data(highlights);
      $m.enter().append('rect').attr('width', '100%').classed('phovea-select-selected', true);
      $m.attr({
        y: (d) => d.acc,
        height: (d) => d.v
      }).style('opacity', 0);
      $m.transition().duration(o.duration).style('opacity', 1);
      $m.exit().remove();
    };
    if (o.selectAble) {
      data.on('select', l);
      AppContext.getInstance().onDOMNodeRemoved(<Element>$data.node(), () => data.off('select', l));
    }

    const onClick = o.selectAble ? (d) => {
        data.select(0, d.range, SelectionUtils.toSelectOperation(<MouseEvent>d3.event));
      } : null;

    this.data.hist().then((hist) => {
      this.hist = hist;
      const histData = this.histData = HistUtils.createHistData(hist, data);

      const $m = $data.selectAll('rect').data(histData);
      $m.enter().append('rect')
        .attr('width', '100%')
        .call(ToolTip.bind<IHistData>((d) => `${d.name} ${d.v} entries (${Math.round(d.ratio * 100)}%)`))
        .on('click', onClick);
      $m.attr({
        y: (d) => d.acc,
        height: (d) => d.v,
        fill: (d) => d.color
      });
      this.fire('built');
      this.markReady();
      if (o.selectAble) {
        data.selections().then((selected) => {
          l(null, 'selected', selected);
        });
      }
    });

    return $svg;
  }

  locateImpl(range: Range) {
    if (range.isAll || range.isNone) {
      const s = this.size;
      return Promise.resolve({x: 0, y: 0, w: s[0], h: s[1]});
    }
    return (<any>this.data).data(range).then((data) => {
      const ex = d3.extent(data, (value) => this.hist.binOf(value));
      const h0 = this.histData[ex[0]];
      const h1 = this.histData[ex[1]];
      const y = Math.min(h0.acc, h1.acc);
      const y2 = Math.max(h0.acc + h0.v, h1.acc + h1.v);
      const scale = this.options.scale;
      return Promise.resolve({
        x: 0,
        width: this.rawSize[0]*scale[0],
        height: (y2 - y)*scale[1],
        y: y*scale[1]
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

    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }

  static createMosaic(data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification, parent: Element, options?: IMosaicOptions) {
    return new Mosaic(data, parent, options);
  }
}
