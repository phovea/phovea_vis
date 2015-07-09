/**
 * Created by Samuel Gratzl on 05.08.2014.
 */

/// <amd-dependency path='css!./style' />

import d3 = require('d3');
import ranges = require('../caleydo_web/range');
import vis = require('../caleydo_web/vis');
import geom = require('../caleydo_web/geom');
import datatypes = require('../caleydo_web/datatype');
import utils = require('../caleydo_web/d3util');
import C = require('../caleydo_web/main');

export class Table extends vis.AVisInstance implements vis.IVisInstance {
  private $node : d3.Selection<any>;
  private options : any = {};

  constructor(public data:any, public parent:Element) {
    super();
    var $p = d3.select(parent);
    switch (data.desc.type) { //depending on the type of the data, create a different table
      case 'matrix':
        this.$node = this.build($p, [this.data.cols(), this.data.rows(), this.data.data()]);
        break;
      case 'table':
        this.$node = this.build($p, [this.data.cols().map((v) => v.name), this.data.rows(), this.data.data()]);
        break;
      case 'vector':
        this.$node = this.build($p, [
          [this.data.desc.name],
          this.data.names(),
          this.data.data().then((data) => data.map((d) => [d]))
        ]);
        break;
    }
    this.$node.datum(data);
    vis.assignVis(<Element>this.$node.node(), this);
  }

  get rawSize() : [number, number] {
    var dim = this.data.dim;
    return [(dim[1]||1) * 200, dim[0] * 22];
  }

  get node() {
    return <Element>this.$node.node();
  }

  locateImpl(range:ranges.Range) {
    var $tbody = d3.select(this.node).select('tbody');
    var offset = (<HTMLElement>$tbody.node()).offsetTop, w = (<Element>$tbody.node()).clientWidth;
    var a, b;
    if (range.isAll || range.isNone) {
      b = $tbody.select('tr:last').node();
      return C.resolved(geom.rect(0, offset, w, b.offsetTop + b.clientHeight));
    }
    var ex:any = d3.extent(range.dim(0).iter().asList());
    a = $tbody.select('tr:nth-child(' + (ex[0] + 1) + ')').node();
    b = $tbody.select('tr:nth-child(' + (ex[1] + 1) + ')').node();
    return C.resolved(geom.rect(0, a.offsetTop, w, b.offsetTop + b.clientHeight - a.offsetTop));
  }

  persist() {
    return null;
  }

  restore(persisted: any) {
    return null;
  }

  transform(scale?: number[], rotate: number = 0) {
    var bak = {
      scale: this.options.scale || [1,1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    this.$node.style('transform','rotate('+rotate+'deg)scale('+scale[0]+','+scale[1]+')');
    var new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform',new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }

  private build($parent:d3.Selection<any>, promises:any[]) {
    var $table = $parent.append('table').attr('class', 'table');
    $table.append('thead').append('tr');
    $table.append('tbody');
    var onClick = utils.selectionUtil(this.data, $table.select('tbody'), 'tr');
    C.all(promises).then((arr) => {
      var cols = arr[0], rows = arr[1], d = arr[2];
      var $headers = $table.select('thead tr').selectAll('th').data(['ID'].concat(cols));
      $headers.enter().append('th');
      $headers.text(C.identity);
      $headers.exit().remove();

      var $rows = $table.select('tbody').selectAll('tr').data(d);
      $rows.enter().append('tr').on('click', onClick);
      $rows.each(function (row, i) {
        var $header = d3.select(this).selectAll('th').data(rows.slice(i, i + 1));
        $header.enter().append('th');
        $header.text(C.identity);
        $header.exit().remove();
        var $row = d3.select(this).selectAll('td').data(row);
        $row.enter().append('td');
        $row.text(C.identity);
        $row.exit().remove();
      });
      $rows.exit().remove();
      this.markReady();
    });

    return $table;
  }
}

export function create(data:datatypes.IDataType, parent:Element) {
  return new Table(data, parent);
}
