/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import {select, extent, selection} from 'd3';
import {BaseUtils} from 'tdp_core';
import {AVisInstance, IVisInstance, VisUtils, IVisInstanceOptions} from 'tdp_core';
import {D3Utils} from 'phovea_d3';
import {IVector} from 'tdp_core';
import {Rect} from 'tdp_core';
import {Range} from 'tdp_core';
import {IValueTypeDesc} from 'tdp_core';

export interface IAListOptions extends IVisInstanceOptions {
  width?: number;
  rowHeight?: number;
  cssClass?: string;
}

const DEFAULT_OPTIONS = {
  scale: [1, 1],
  rotate: 0,
  width: 200,
  rowHeight: 20,
  cssClass: ''
};

export abstract class AList<T, D extends IValueTypeDesc, O extends IAListOptions> extends AVisInstance implements IVisInstance {
  protected readonly options: O;

  private readonly $node: d3.Selection<any>;

  constructor(public readonly data: IVector<T,D>, private readonly parent: HTMLElement, options: O) {
    super();
    this.options = BaseUtils.mixin(<any>{}, DEFAULT_OPTIONS, options);
    this.$node = select(parent).append('div').attr('class', 'phovea-list ' + this.options.cssClass);
    this.$node.datum(this);
    VisUtils.assignVis(this.node, this);
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
    return Promise.resolve(Rect.rect(0, a.offsetTop, w, b.offsetTop + b.clientHeight - a.offsetTop));
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
    this.$node.style('height', `${scale[1] * this.data.length * this.options.rowHeight}px`);
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    this.update();
    return act;
  }

  protected abstract render($enter: d3.Selection<T>, $update: d3.Selection<T>);

  update() {
    this.render(selection(), this.$node.selectAll('div'));
  }

  protected build() {
    const scale = this.options.scale;
    this.$node.style('width', `${scale[0] * this.options.width}px`);
    this.$node.style('height', `${scale[1] * this.data.length * this.options.rowHeight}px`);

    const onClick = D3Utils.selectionUtil(this.data, this.$node, 'div');
    this.data.data().then((arr: T[]) => {
      const $rows = this.$node.selectAll('div').data(arr);
      const $rowsEnter = $rows.enter().append('div').on('click', onClick);
      this.render($rowsEnter, $rows);
      $rows.exit().remove();
      this.markReady();
    });
  }
}
