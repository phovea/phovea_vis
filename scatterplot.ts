/**
 * Created by Marc Streit on 06.08.2014.
 */
/// <amd-dependency path='css!./style' />

/* global define */
'use strict';

import C = require('../caleydo_core/main');
import d3 = require('d3');
import vis = require('../caleydo_core/vis');
import tooltip = require('../caleydo_d3/tooltip');
import matrix = require('../caleydo_core/matrix');

export class ScatterPlot extends vis.AVisInstance implements vis.IVisInstance {
  private options = {
    scale: [1, 1],
    rotate: 0
  };

  private $node:d3.Selection<ScatterPlot>;

  constructor(public data:matrix.IMatrix, parent:Element, options:any = {}) {
    super();
    C.mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
  }

  get rawSize():[number, number] {
    return [300, 300];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent:d3.Selection<any>) {
    const size = this.size,
      data = this.data;

    const width = size[0], height = size[1];

    var xcol = 0;
    var ycol = 1;

    const svg = $parent.append('svg').attr({
      width: width,
      height: height,
      class: 'caleydo-scatterplot'
    });

    var that = this;

    // bind data to chart
    Promise.all<any[]>([data.data(), data.rows()]).then((promise) => {
      var arr : any[] = promise[0];
      var rowNames : string[] = promise[1];

      // create scales
      var x = d3.scale.linear().domain([0, d3.max(arr, (d) => d[xcol])]).range([0, width]),
        y = d3.scale.linear().domain([0, d3.max(arr, (d) => d[ycol])]).range([height, 0]);

      svg.selectAll('circle')
        .data(arr)
        .enter().append('circle')
        .attr('cx', (d) => x(d[xcol]))
        .attr('cy', (d) => y(d[ycol]))
        .attr('r', 2)
        .call(tooltip.bind((d, i) => rowNames[i]));
    });

    function update() {
      that.data.data().then((arr) => {

        // create scales
        var x = d3.scale.linear().domain([0, d3.max(arr, (d) => d[xcol])]).range([0, width]),
          y = d3.scale.linear().domain([0, d3.max(arr, (d) => d[ycol])]).range([height, 0]);

        svg.selectAll('circle')
          .transition()
          .ease('linear')
          .duration(1000)
          .attr('cx', (d) => x(d[xcol]))
          .attr('cy', (d) => y(d[ycol]));
      });
    }

    var $xaxis = $parent.append('select')
      .on('change', function () {
        xcol = this.selectedIndex;
        update();
      });
    var $yaxis = $parent.append('select')
      .on('change', function () {
        ycol = this.selectedIndex;
        update();
      });

    data.cols().then((cols) => {
      var $x = $xaxis.selectAll('option').data(cols);
      $x.enter().append('option');
      $x.attr('value', (d, i) => i)
        .text(C.identity)
        .each(function (d, i) {
          if (i === xcol) {
            d3.select(this).attr('selected', 'selected');
          }
        });
      $x.exit().remove();

      var $y = $yaxis.selectAll('option').data(cols);
      $y.enter().append('option');
      $y.attr('value', (d, i) => i)
        .text(C.identity)
        .each(function (d, i) {
          if (i === ycol) {
            d3.select(this).attr('selected', 'selected');
          }
        });
      $y.exit().remove();
    });

    return svg;
  }
}

export function create(data:matrix.IMatrix, parent:Element, options) {
  return new ScatterPlot(data, parent, options);
}
