/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import './style.scss';
import * as d3 from 'd3';
import {onDOMNodeRemoved, mixin} from 'phovea_core/src';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {IVector} from 'phovea_core/src/vector';
import {toSelectOperation} from 'phovea_core/src/idtype';

export class BarPlot extends AVisInstance implements IVisInstance {
  private options = {
    cssClass: '',
    width: 100,
    heighti: 10,
    min: 0,
    max: NaN,
    scale: [1, 1],
    rotate: 0
  };

  private $node:d3.Selection<BarPlot>;

  private xscale:d3.scale.Linear<number, number>;
  private yscale:d3.scale.Linear<number, number>;

  constructor(public data:IVector, parent:Element, options:any = {}) {
    super();
    mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(<Element>this.$node.node(), this);
  }

  get rawSize():[number, number] {
    return [this.options.width, this.data.dim[0] * this.options.heighti];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent:d3.Selection<any>) {
    const o = this.options,
      size = this.size,
      data = this.data;
    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-barplot ' + o.cssClass
    });

    //using range bands with an ordinal scale for uniform distribution
    const xscale = this.xscale = d3.scale.linear().range([0, 100]);
    const yscale = this.yscale = d3.scale.linear().range([0, 100]);

    const onClick = function (d, i) {
      data.select(0, [i], toSelectOperation(d3.event));
    };

    const l = function (event, type, selected) {
      $svg.selectAll('rect').classed('phovea-select-' + type, false);
      if (selected.isNone) {
        return;
      }
      var dim0 = selected.dim(0);
      if (selected.isAll) {
        $svg.selectAll('rect').classed('phovea-select-' + type, true);
      } else {
        dim0.forEach((j) => $svg.selectAll('rect:nth-child(' + (j + 1) + ')').classed('phovea-select-' + type, true));
      }
    };
    data.on('select', l);
    onDOMNodeRemoved(<Element>$svg.node(), () => data.off('select', l));

    data.data().then((_data) => {
      yscale.domain([0, data.length]);
      if (isNaN(o.min) || isNaN(o.max)) {
        var minmax = d3.extent(_data);
        if (isNaN(o.min)) {
          o.min = minmax[0];
        }
        if (isNaN(o.max)) {
          o.max = minmax[1];
        }
      }
      xscale.domain([o.min, o.max]);

      var $m = $svg.selectAll('rect').data(_data);
      $m.enter().append('rect')
        .on('click', onClick);
      $m.attr({
        y: (d, i) => yscale(i),
        height: (d) => yscale(1),
        width: xscale
      });
      this.markReady();
      data.selections().then((selected) => l(null, 'selected', selected));
    });

    return $svg;
  }

  locateImpl(range) {
    const o = this.options;
    var ex_i = d3.extent(range.dim(0).iter().asList());

    return this.data.data(range).then((data) => {
      var ex_v = d3.extent(data);
      return rect(
        this.xscale(ex_v[0]) / 100.0 * o.width,
        ex_i[0] * o.heighti,
        this.xscale(ex_v[1]) / 100.0 * o.width,
        (ex_i[1] + 1) * o.heighti
      );
    });
  }
}

export function create(data:IVector, parent:Element, options) {
  return new BarPlot(data, parent, options);
}
