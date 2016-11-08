/**
 * Created by Samuel Gratzl on 01.10.2015.
 */


import './style.scss';
import * as d3 from 'd3';
import {Range} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {mixin} from 'phovea_core/src';
import {IVector} from 'phovea_core/src/vector';
import {} from 'phovea_core/src/vis';
import {} from 'phovea_core/src/range';
import {} from 'phovea_core/src';


export class KaplanMeierPlot extends AVisInstance implements IVisInstance {
  private $node:d3.Selection<any>;

  private options = {
    scale: [1, 1],
    rotate: 0,
    width: 300,
    height: 300,
    maxTime: (died: number[]) => died[died.length-1]
  };

  private line = d3.svg.line().interpolate('step');

  constructor(public data:IVector, public parent:Element, options:any = {}) {
    super();
    //var value = (<any>this.data.desc).value;
    mixin(this.options, options);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    assignVis(<Element>this.$node.node(), this);
  }

  get rawSize():[number, number] {
    return [this.options.width, this.options.height];
  }

  get node() {
    return <Element>this.$node.node();
  }

  locateImpl(range:Range) {
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
    const width = this.options.width,
      height = this.options.height,
      scale = this.options.scale || [1,1];

    const $svg = $parent.append('svg').attr({
      width: width * scale[0],
      height: height * scale[1],
      'class': 'phovea-kaplanmeier'
    });

    const $g = $svg.append('g');

    const xscale = d3.scale.linear().range([0, width]);
    const yscale = d3.scale.linear().range([0, height]);

    this.line
      .x((d) => xscale(d[0]))
      .y((d) => yscale(d[1]));

    this.data.data().then((arr) => {
      //TODO
      const died = arr.filter((a) => !isNaN(a) && a !== null).map((a) => Math.abs(a));
      died.sort(d3.ascending);
      //const alive = arr.length - died.length;

      yscale.domain([0, arr.length]);

      Promise.resolve(d3.functor(this.options.maxTime)(died)).then((maxAxisTime) => {
        xscale.domain([0, maxAxisTime]);

        //0 ... 100%
        var points = [[0, 0]],
          prev_i = 0;
        for (let i = 1; i < died.length; ++i) {
          while(died[i] === died[i-1] && i < died.length) {
            ++i;
          }
          points.push([died[prev_i], prev_i + 1]);
          prev_i = i;
        }
        if (died.length > 0) {
          points.push([died[prev_i], prev_i + 1]);
        }
        points.push([maxAxisTime, died.length]);
        $g.append('path').datum(points).attr('d', this.line);
        this.markReady();
      });
    });
    return $svg;
  }
}

export function create(data:IVector, parent:Element, options) {
  return new KaplanMeierPlot(data, parent, options);
}
