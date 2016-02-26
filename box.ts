/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
/// <amd-dependency path='css!./style' />

/* global define */
'use strict';


import C = require('../caleydo_core/main');
import d3 = require('d3');
import vis = require('../caleydo_core/vis');
import vector = require('../caleydo_core/vector');
import ranges = require('../caleydo_core/range');
import geom = require('../caleydo_core/geom');
import tooltip = require('../caleydo_d3/tooltip');

function createText(stats) {
  var r = '<table><tbody>';
  var keys = ['min', 'max', 'sum', 'mean', 'var', 'sd', 'n', 'nans', 'moment2', 'moment3', 'moment4', 'kurtosis', 'skewness'];
  keys.forEach(function (key) {
    var value = stats[key];
    r = r + '<tr><td>' + key + '</td><td>' + value + '</td></tr>';
  });
  r = r + '</tbody></table>';
  return r;
}

export class BoxPlot extends vis.AVisInstance implements vis.IVisInstance {
  private options = {
    scale: [1, 1],
    rotate: 0
  };

  private $node:d3.Selection<BoxPlot>;

  private scale:d3.scale.Linear<number, number>;

  constructor(public data:vector.IVector, parent:Element, options:any = {}) {
    super();
    C.mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
  }

  get rawSize():[number, number] {
    return [300, 50];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent:d3.Selection<any>) {
    const size = this.size,
      data = this.data;
    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'box'
    });

    const $t = $svg.append('g');

    const s = this.scale = d3.scale.linear().domain((<any>this.data.desc).value.range).range([0, size[0]]).clamp(true);

    $t.append('path').attr({
      d: 'M0,0 L0,$ M0,§ L%,§ M%,0 L%,$'.replace(/%/g, String(size[0])).replace(/\$/g, String(size[1])).replace(/\§/g, String(size[1] / 2)),
      'class': 'axis'
    });
    data.stats().then((stats) => {
      const text = createText(stats);

      $t.append('rect').attr({
        x: s(stats.mean - stats.sd),
        y: '10%',
        width: s(stats.sd * 2),
        height: '80%',
        'class': 'box'
      }).call(tooltip.bind(text));

      $t.append('line').attr({
        x1: s(stats.mean),
        x2: s(stats.mean),
        y1: '10%',
        y2: '90%',
        'class': 'mean'
      });
      this.markReady();
    });

    return $svg;
  }

  locateImpl(range:ranges.Range) {
    const that = this;
    if (range.isAll || range.isNone) {
      var r = this.scale.range();
      return Promise.resolve(geom.rect(r[0], 0, r[1] - r[0], 50));
    }
    return this.data.data(range).then(function (data) {
      var ex = d3.extent(data, that.scale);
      return geom.rect(ex[0], 0, ex[1] - ex[0], 50);
    });
  }
}

export function create(data:vector.IVector, parent:Element, options) {
  return new BoxPlot(data, parent, options);
}
