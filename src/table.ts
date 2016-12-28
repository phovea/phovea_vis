/**
 * Created by Samuel Gratzl on 05.08.2014.
 */

import './style.scss';
import * as d3 from 'd3';
import {Range} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis, IVisInstanceOptions} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {IAnyMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {IAnyVector} from 'phovea_core/src/vector';
import {selectionUtil} from 'phovea_d3/src/d3util';
import {mixin} from 'phovea_core/src';

export interface ITableOptions extends IVisInstanceOptions {

}

export class Table extends AVisInstance implements IVisInstance {
  private readonly $node: d3.Selection<any>;
  private readonly options: ITableOptions = {
    scale: [1, 1],
    rotate: 0
  };

  constructor(public readonly data: IAnyMatrix|ITable|IAnyVector, parent: Element, options: ITableOptions = {}) {
    super();
    mixin(this.options, options);
    const $p = d3.select(parent);
    switch (data.desc.type) { //depending on the type of the data, create a different table
      case 'matrix':
        const dmatrix = <IAnyMatrix>data;
        this.$node = this.build($p, [dmatrix.cols(), dmatrix.rows(), dmatrix.data()]);
        break;
      case 'table':
        const dtable = <ITable>data;
        this.$node = this.build($p, [dtable.cols().map((v) => v.desc.name), dtable.rows(), this.data.data()]);
        break;
      case 'vector':
        const dvector = <IAnyVector>data;
        this.$node = this.build($p, [
          [dvector.desc.name],
          dvector.names(),
          dvector.data().then((data) => data.map((d) => [d]))
        ]);
        break;
    }
    this.$node.datum(data);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    const dim = this.data.dim;
    return [(dim[1] || 1) * 200, dim[0] * 22];
  }

  get node() {
    return <Element>this.$node.node();
  }

  locateImpl(range: Range) {
    const $tbody = d3.select(this.node).select('tbody');
    const offset = (<HTMLElement>$tbody.node()).offsetTop, w = (<Element>$tbody.node()).clientWidth;
    let a, b;
    if (range.isAll || range.isNone) {
      b = $tbody.select('tr:last').node();
      return Promise.resolve(rect(0, offset, w, b.offsetTop + b.clientHeight));
    }
    const ex: any = d3.extent(range.dim(0).iter().asList());
    a = $tbody.select('tr:nth-child(' + (ex[0] + 1) + ')').node();
    b = $tbody.select('tr:nth-child(' + (ex[1] + 1) + ')').node();
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
    this.$node.style('transform', 'rotate(' + rotate + 'deg)scale(' + scale[0] + ',' + scale[1] + ')');
    const new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform', new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }

  private build($parent: d3.Selection<any>, promises: any[]) {
    const $table = $parent.append('table').attr('class', 'phovea-table');
    $table.append('thead').append('tr');
    $table.append('tbody');
    const onClick = selectionUtil(this.data, $table.select('tbody'), 'tr');
    Promise.all(promises).then((arr) => {
      const cols: string[] = arr[0], rows: string[] = arr[1], d: any[][] = arr[2];
      const $headers = $table.select('thead tr').selectAll('th').data(['ID'].concat(cols));
      $headers.enter().append('th');
      $headers.text(String);
      $headers.exit().remove();

      const $rows = $table.select('tbody').selectAll('tr').data(d);
      $rows.enter().append('tr').on('click', onClick);
      $rows.each(function (row: any[], i) {
        const $header = d3.select(this).selectAll('th').data(rows.slice(i, i + 1));
        $header.enter().append('th');
        $header.text(String);
        $header.exit().remove();
        const $row = d3.select(this).selectAll<any>('td').data(row);
        $row.enter().append('td');
        $row.text(String);
        $row.exit().remove();
      });
      $rows.exit().remove();
      this.markReady();
    });

    return $table;
  }
}

export function create(data: IAnyMatrix|ITable|IAnyVector, parent: Element, options?: ITableOptions) {
  return new Table(data, parent, options);
}
