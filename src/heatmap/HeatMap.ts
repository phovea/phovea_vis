/**
 * Created by Samuel Gratzl on 26.12.2016.
 */


import '../style.scss';
import * as d3 from 'd3';
import {Range} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {mixin} from 'phovea_core/src';
import {INumericalMatrix,ICategoricalMatrix} from 'phovea_core/src/matrix';
import {defaultColor, defaultDomain, toScale, IScale, ICommonHeatMapOptions} from './internal';
import {IHeatMapRenderer, ESelectOption} from './IHeatMapRenderer';
import HeatMapDOMRenderer from './HeatMapDOMRenderer';
import HeatMapImageRenderer from './HeatMapImageRenderer';
import HeatMapCanvasRenderer from './HeatMapCanvasRenderer';

export declare type IHeatMapAbleMatrix = INumericalMatrix|ICategoricalMatrix;

function createRenderer(d: IHeatMapAbleMatrix, selectAble: ESelectOption = ESelectOption.CELL, forceThumbnails: boolean = false): IHeatMapRenderer {
  const cells = d.length;
  if (cells <= 1000) {
    return new HeatMapDOMRenderer(selectAble);
  }
  const url = d.heatmapUrl(); //can the url be created the return value should be valid
  if (url && forceThumbnails) {
    return new HeatMapImageRenderer(selectAble);
  } else if (cells < 5000 || url === null) {
    return new HeatMapCanvasRenderer(selectAble);
  } else {
    return new HeatMapImageRenderer(selectAble);
  }
}

export interface IHeatMapOptions extends ICommonHeatMapOptions {
  /**
   * @default null
   */
  scaleTo?: [number, number];
  /**
   * @default 200
   */
  duration?: number;
  /**
   * @default true
   */
  selectAble?: boolean;
  /**
   * force using images if possible
   * @default false
   */
  forceThumbnails?: boolean;
}

export default class HeatMap extends AVisInstance implements IVisInstance {
  private $node: d3.Selection<any>;
  private colorer: IScale;
  private renderer: IHeatMapRenderer;

  private readonly options: IHeatMapOptions = {
    initialScale: 10,
    scaleTo: null,
    duration: 200,
    selectAble: true,
    forceThumbnails: false,
    scale: [1, 1],
    rotate: 0
  };

  constructor(public data: IHeatMapAbleMatrix, public parent: Element, options: IHeatMapOptions = {}) {
    super();
    const value = this.data.valuetype;
    mixin(this.options, {
      color: defaultColor(value),
      domain: defaultDomain(value)
    }, options);
    this.options.scale = [this.options.initialScale, this.options.initialScale];
    if (this.options.scaleTo) {
      let raw = this.data.dim;
      this.options.scale = <[number, number]>this.options.scaleTo.map((d, i) => d / raw[i]);
    }
    this.options.rotate = 0;
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);

    this.renderer = createRenderer(data, typeof this.options.selectAble === 'boolean' ? (this.options.selectAble ? ESelectOption.CELL : ESelectOption.NONE) : ESelectOption[<string>this.options.selectAble], this.options.forceThumbnails);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    const d = this.data.dim;
    return [d[1], d[0]];
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
    const width = dims[1], height = dims[0], o = this.options;

    function l(r, max, s) {
      if (r.isAll || r.isNone) {
        return [0, max * s];
      }
      const ex: any = d3.extent(r.iter().asList());
      return [ex[0] * s, (ex[1] - ex[0] + 1) * s];
    }

    const xw = l(range.dim(1), width, o.scale[0]);
    const yh = l(range.dim(0), height, o.scale[1]);
    return Promise.resolve(rect(xw[0], yh[0], xw[1], yh[1]));
  }

  transform(scale?: [number, number], rotate: number = 0) {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    const dims = this.data.dim;
    this.$node.style('transform', 'rotate(' + rotate + 'deg)');
    if (bak.scale[0] !== scale[0] || bak.scale[1] !== scale[1]) {
      this.renderer.rescale(this.$node, dims, scale);
    }
    const new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform', new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }

  private recolor() {
    const c = this.colorer;
    c.domain(this.options.domain).range(this.options.color);
    this.renderer.recolor(this.$node, this.data, c, this.options.scale);
  }

  private build($parent: d3.Selection<any>) {
    return this.renderer.build(this.data, $parent, this.options.scale, this.colorer, () => {
      this.renderer.redraw(this.$node, this.options.scale);
      this.markReady();
    });
  }

  update() {
    this.renderer.redraw(this.$node, this.options.scale);
  }
}

export function create(data: IHeatMapAbleMatrix, parent: HTMLElement, options?: IHeatMapOptions){
  return new HeatMap(data, parent, options);
}
