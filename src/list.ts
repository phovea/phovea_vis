/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import './style.scss';
import {select, extent, format} from 'd3';
import * as d3 from 'd3';
import {mixin} from 'phovea_core/src';
import {AVisInstance, IVisInstance, assignVis, ITransform, IVisInstanceOptions} from 'phovea_core/src/vis';
import {selectionUtil} from 'phovea_d3/src/d3util';
import {IAnyVector} from 'phovea_core/src/vector';
import {rect} from 'phovea_core/src/geom';
import {Range} from 'phovea_core/src/range';
import {fire} from 'phovea_core/src/event';
import {SelectOperation} from 'phovea_core/src/idtype/IIDType';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {EOrientation} from './heatmap/internal';

export interface IListOptions extends IVisInstanceOptions {
  /**
   * @default ''
   */
  cssClass?: string;

  /**
   * @default null
   */
  format?: string;

  /**
   * @default 200
   */
  width?: number;

  /**
   * @default 20
   */
  rowHeight?: number;

  heightTo?: number;

  orientation?: number;
}

export class List extends AVisInstance implements IVisInstance {
  private readonly options: IListOptions = {
    cssClass: '',
    format: null,
    scale: [1, 1],
    rotate: 0,
    width: 200,
    rowHeight: 20
  };

  static readonly EVENT_BRUSHING = 'brushing';
  static readonly EVENT_BRUSH_CLEAR = 'clearbrushing';

  private readonly $node: d3.Selection<List>;

  constructor(public readonly data: IAnyVector, parent: HTMLElement, options: IListOptions = {}) {
    super();
    mixin(this.options, options);

    this.$node = this.build(select(parent));
    this.$node.datum(this);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [this.options.width, this.data.length * this.options.rowHeight];
  }

  get node() {
    return <HTMLElement>this.$node.node();
  }

  locateImpl(range: Range) {
    const w = this.node.clientWidth;
    const $node = select(this.node);
    let a: HTMLElement, b: HTMLElement;
    if (range.isAll || range.isNone) {
      a = <HTMLElement>this.node.firstElementChild;
      b = <HTMLElement>this.node.lastElementChild;
    } else {
      const ex: any = extent(range.dim(0).iter().asList());
      a = <HTMLElement>this.node.childNodes.item(ex[0]);
      b = <HTMLElement>this.node.childNodes.item(ex[1]);
    }
    return Promise.resolve(rect(0, a.offsetTop, w, b.offsetTop + b.clientHeight - a.offsetTop));
  }

  transform(scale?: [number, number], rotate: number = 0) {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    this.$node.style('transform', 'rotate(' + rotate + 'deg)');
    this.$node.style('width', `${scale[0] * this.options.width}px`);
    if (this.options.orientation === EOrientation.Vertical) {
      this.$node.style('height', `${scale[1] * this.data.length * this.options.rowHeight}px`);
    } else if (this.options.orientation === EOrientation.Horizontal) {

      this.$node.style('height', `${this.options.heightTo}px`);
    }
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }

  private build($parent: d3.Selection<any>) {
    const scale = this.options.scale;
    const $list = $parent.append('div').attr('class', 'phovea-list ' + (this.options.orientation === EOrientation.Vertical ? 'ver ' : 'hor ') + this.options.cssClass);
    $list.style('width', `${scale[0] * this.options.width}px`);
    if (this.options.orientation === EOrientation.Vertical) {
      $list.style('height', `${scale[1] * this.data.length * this.options.rowHeight}px`);
    } else if (this.options.orientation === EOrientation.Horizontal) {

      $list.style('height', `${this.options.heightTo}px`);
    }


    const onClick = selectionUtil(this.data, $list, 'div', SelectOperation.ADD);
    this.data.data().then((arr: any[]) => {
      let start = null;
      let topBottom = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
      const $rows = $list.selectAll('div').data(arr);
      $rows.enter().append('div')
        .attr('title', (d) => d)
        .on('mousedown', (d, i) => {
         /* if (start !== null) {
            return;
          }

          topBottom = this.updateTopBotom(i, topBottom);

          start = {d, i, applied: false};

          if (toSelectOperation(<MouseEvent>d3.event) === SelectOperation.SET) {
            fire(List.EVENT_BRUSH_CLEAR, this.data);
            this.data.clear();
          }*/
          //fire(List.EVENT_BRUSH_CLEAR, this.data);
          //this.data.clear();
          topBottom = this.updateTopBottom(i, topBottom[1], topBottom);
        })
        .on('mouseenter', (d, i) => {
          /*if (start === null) {
            return;
          }

          onClick(d, i); // select current entered element

          topBottom = this.updateTopBotom(i, topBottom);

          // select first element, when started brushing
          if (start.applied === false) {
            onClick(start.d, start.i);
            start.applied = true;
          }*/
          //myEnd = i;
          /*
          // clear selection and select everything from start to end
          if(myStart != null) {
            onClick(d, i);
          }*/
        })
        .on('mouseup', (d, i) => {
          if(topBottom[0] !== Number.NEGATIVE_INFINITY) {
            topBottom = this.updateTopBottom(topBottom[0], i, topBottom);
            console.log('topbottom: ' + topBottom[0] + ' end: ' + topBottom[1]);
            topBottom = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
            //fire(List.EVENT_BRUSHING, topBottom, this.data);
            //onClick(3, 5);
          }
          //fire(List.EVENT_BRUSHING, topBottom, this.data);
          /*if (start === null) {
            return;
          }

          // select as click
          if (start.applied === false) {
            onClick(start.d, start.i);

          }
          topBottom = this.updateTopBotom(i, topBottom);

          fire(List.EVENT_BRUSHING, topBottom, this.data);

          start = null;*/
        });
      const formatter = this.options.format ? format(this.options.format) : String;
      $rows.text(formatter);
      $rows.exit().remove();
      this.markReady();
    });
    return $list;
  }

  private updateTopBottom(top: number, bottom: number, topBottom: number[]) {
    if(top > bottom) {
      const tmp = top;
      top = bottom;
      bottom = tmp;
    }
    topBottom[0] = top;
    topBottom[1] = bottom;
    return topBottom;
  }

}

export default List;

export function create(data: IAnyVector, parent: HTMLElement, options: IListOptions) {
  return new List(data, parent, options);
}

