/**
 * Created by Samuel Gratzl on 26.12.2016.
 */


import '../style.scss';
import * as d3 from 'd3';
import Range from 'phovea_core/src/range/Range';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {mixin, onDOMNodeRemoved} from 'phovea_core/src';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {INumericalMatrix, ICategoricalMatrix, DIM_ROW, DIM_COL} from 'phovea_core/src/matrix/IMatrix';
import {DefaultUtils} from './DefaultUtils';
import {ICommonHeatMapOptions} from './ICommonHeatMapOptions';
import {toScale, IScale} from './IScale';
import {IHeatMapRenderer, ESelectOption} from './IHeatMapRenderer';
import {HeatMapDOMRenderer} from './HeatMapDOMRenderer';
import {HeatMapImageRenderer} from './HeatMapImageRenderer';
import {HeatMapCanvasRenderer} from './HeatMapCanvasRenderer';
import {HeatMap1D, IHeatMap1DOptions, IHeatMapAbleVector} from './HeatMap1D';

export declare type IHeatMapAbleMatrix = INumericalMatrix|ICategoricalMatrix;

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

  /**
   * render optional labels,
   * @default NONE
   */
  labels?: ESelectOption;
}

export class HeatMap extends AVisInstance implements IVisInstance {
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
    rotate: 0,
    labels: ESelectOption.NONE,
    missingColor: '#d400c2',
    mode: 'sm'
  };

  constructor(public data: IHeatMapAbleMatrix, public parent: Element, options: IHeatMapOptions = {}) {
    super();
    const value = this.data.valuetype;
    mixin(this.options, {
      color: DefaultUtils.defaultColor(value),
      domain: DefaultUtils.defaultDomain(value)
    }, options);

    // if direct scale not given use initial scale
    if (!options.scale) {
      this.options.scale = [this.options.initialScale, this.options.initialScale];
    }
    if (this.options.scaleTo) {
      const raw = this.data.dim;
      this.options.scale = <[number, number]>this.options.scaleTo.map((d, i) => d / raw[i]);
    }
    this.options.rotate = 0;
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);

    // handle string case
    this.options.labels = typeof this.options.labels === 'string' ? ESelectOption[<string>this.options.labels]: this.options.labels;

    const selection = typeof this.options.selectAble === 'boolean' ? (this.options.selectAble ? ESelectOption.CELL : ESelectOption.NONE) : ESelectOption[<string>this.options.selectAble];

    this.renderer = HeatMap.createRenderer(data, selection, this.options);

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


      if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.ROW) {
        this.$node.select('div.row-labels')
          .style('height', dims[0] * scale[1] + 'px')
          .style('right', dims[1] * scale[0] + 'px');
      }
      if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.COLUMN) {
        this.$node.select('div.column-labels')
          .style('height', dims[1] * scale[0] + 'px');
      }
    }
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }

  private recolor() {
    const c = this.colorer;
    c.domain(this.options.domain).range(this.options.color);
    this.renderer.recolor(this.$node, this.data, c, this.options.scale);
  }

  private build($parent: d3.Selection<any>) {
    const $node = this.renderer.build(this.data, $parent, this.options.scale, this.colorer, () => {
      this.renderer.redraw(this.$node, this.options.scale);
      this.markReady();
    });

    if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.ROW) {
      this.renderLabels($node, ESelectOption.ROW, this.data.rows())
        .style('height', this.size[1] + 'px')
        .style('right', this.size[0] + 'px');
    }
    if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.COLUMN) {
      this.renderLabels($node, ESelectOption.COLUMN, this.data.cols())
        .style('height', this.size[0] + 'px');
    }

    return $node;
  }

  private renderLabels($node: d3.Selection<any>, mode: ESelectOption, names: Promise<string[]>) {
    const dim = mode === ESelectOption.ROW ? DIM_ROW : DIM_COL;
    const $group = $node.append('div').attr('class', 'phovea-heatmap-labels ' + (mode === ESelectOption.ROW ? 'row-labels' : 'column-labels'));

    const l = function (event: any, type: string, selected: Range) {
      const all = $group.selectAll('div');
      all.classed('phovea-select-' + type, false);
      const dimSelections = selected.dim(dim);
      if (dimSelections.isAll && !selected.dim(1 - dim).isAll) {
        return;
      }
      const sub = dimSelections.filter(all[0]);
      if (sub.length > 0) {
        d3.selectAll(sub).classed('phovea-select-' + type, true);
      }
    };

    names.then((data) => {
      const $names = $group.selectAll('div').data(data);
      $names.enter().append('div').on('click', (d, i) => {
        this.data.select(dim, [i], toSelectOperation(<MouseEvent>d3.event));
      });
      $names.text(String);
      $names.exit().remove();

      this.data.selections().then((selected) => {
        l(null, 'selected', selected);
      });
    });
    this.data.on('select', l);
    onDOMNodeRemoved(<Element>$group.node(), () => {
      this.data.off('select', l);
    });

    return $group;
  }

  update() {
    this.renderer.redraw(this.$node, this.options.scale);
  }

  static createRenderer(d: IHeatMapAbleMatrix, selectAble: ESelectOption = ESelectOption.CELL, options:IHeatMapOptions): IHeatMapRenderer {
    const cells = d.length;
    if (cells <= 1000) {
      return new HeatMapDOMRenderer(selectAble, options);
    }
    const url = d.heatmapUrl(); //can the url be created the return value should be valid
    if (url && options.forceThumbnails) {
      return new HeatMapImageRenderer(selectAble, options);
    } else if (cells < 5000 || url === null) {
      return new HeatMapCanvasRenderer(selectAble, options);
    } else {
      return new HeatMapImageRenderer(selectAble, options);
    }
  }

  static create2D(data: IHeatMapAbleMatrix, parent: HTMLElement, options?: IHeatMapOptions) {
    return new HeatMap(data, parent, options);
  }

  static createHeatMapDimensions(data: IHeatMapAbleMatrix|IHeatMapAbleVector, parent: HTMLElement, options?: IHeatMapOptions|IHeatMap1DOptions): AVisInstance {
    if (data.desc.type === 'matrix') {
      return HeatMap.create2D(<IHeatMapAbleMatrix>data, parent, <IHeatMapOptions>options);
    } else if (data.desc.type === 'vector') {
      return HeatMap1D.create1D(<IHeatMapAbleVector>data, parent, <IHeatMap1DOptions>options);
    }
    throw new Error('unknown data type: ' + data.desc.type);
  }
}

