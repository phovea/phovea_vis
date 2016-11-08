/**
 * Created by Marc Streit on 06.08.2014.
 */


import './style.scss';
import * as d3 from 'd3';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {identity, mixin} from 'phovea_core/src';
import bindTooltip from 'phovea_d3/src/tooltip';
import {IMatrix} from 'phovea_core/src/matrix';

export class ScatterPlot extends AVisInstance implements IVisInstance {
  private options = {
    scale: [1, 1],
    rotate: 0
  };

  private $node:d3.Selection<ScatterPlot>;

  constructor(public data:IMatrix, parent:Element, options:any = {}) {
    super();
    mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(<Element>this.$node.node(), this);
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
      class: 'phovea-scatterplot'
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
        .call(bindTooltip((d, i) => rowNames[i]));
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
        .text(identity)
        .each(function (d, i) {
          if (i === xcol) {
            d3.select(this).attr('selected', 'selected');
          }
        });
      $x.exit().remove();

      var $y = $yaxis.selectAll('option').data(cols);
      $y.enter().append('option');
      $y.attr('value', (d, i) => i)
        .text(identity)
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

export function create(data:IMatrix, parent:Element, options) {
  return new ScatterPlot(data, parent, options);
}
