/**
 * Created by Samuel Gratzl on 01.10.2015.
 */
/* global define */

import d3 = require('d3');
import d3utils = require('../caleydo_d3/d3util');
import vector = require('../caleydo_core/vector');
import vis = require('../caleydo_core/vis');
import ranges = require('../caleydo_core/range');
import geom = require('../caleydo_core/geom');
import C = require('../caleydo_core/main');


export class KaplanMeierPlot extends vis.AVisInstance implements vis.IVisInstance {
  private $node:d3.Selection<any>;

  private options = {
    scale: [1, 1],
    rotate: 0,
    width: 300,
    height: 300
  };

  constructor(public data:vector.IVector, public parent:Element, options:any = {}) {
    super();
    var value = (<any>this.data.desc).value;
    C.mixin(this.options, options);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    vis.assignVis(<Element>this.$node.node(), this);
  }

  get rawSize():[number, number] {
    return [this.options.width, this.options.height];
  }

  get node() {
    return <Element>this.$node.node();
  }

  locateImpl(range:ranges.Range) {
    //TODO
    return Promise.resolve(null);
  }

  transform(scale?:number[], rotate:number = 0) {
    var bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    var dims = this.data.dim;
    var width = this.options.width, height = this.options.height;
    this.$node.attr({
      width: width * scale[0],
      height: height * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
    var new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform', new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }

  private build($parent:d3.Selection<any>) {
    var dims = this.data.dim;
    var width = this.options.width, height = this.options.height;
    var $svg = $parent.append('svg').attr({
      width: width,
      height: height,
      'class': 'kaplanmeier'
    });
    var $g = $svg.append('g');

    this.data.data().then((arr) => {
      //TODO

      this.markReady();
    });
    return $svg;
  }
}

export function create(data:vector.IVector, parent:Element, options) {
  return new KaplanMeierPlot(data, parent, options);
}
