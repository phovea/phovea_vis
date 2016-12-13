/**
 * Created by Samuel Gratzl on 26.01.2016.
 */

import './style.scss';
import * as d3 from 'd3';
import {onDOMNodeRemoved, mixin} from 'phovea_core/src';
import {Range} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis, ITransform} from 'phovea_core/src/vis';
import {IDataType, IDataDescription} from 'phovea_core/src/datatype';
import {ICatHistogram, IHistogram} from 'phovea_core/src/math';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {vec2, polygon} from 'phovea_core/src/geom';
import bindTooltip from 'phovea_d3/src/tooltip';


interface IHistData {
  v: number;
  acc: number;
  ratio: number;
  range: Range;
  name: string;
  color: string;
}

function createCategoricalHistData(hist:ICatHistogram):IHistData[] {
  var categories:any[] = hist.categories,
    cols = hist.colors || d3.scale.category10().range(),
    total = hist.validCount;
  var data = [],
    acc = 0;
  hist.forEach((b, i) => {
    data[i] = {
      v: b,
      acc: acc,
      ratio: b / total,
      range: hist.range(i),

      name: (typeof categories[i] === 'string') ? categories[i] : categories[i].name,
      color: (categories[i].color === undefined) ? cols[i] : categories[i].color
    };
    acc += b;
  });
  return data;
}

function createNumericalHistData(hist:IHistogram, range:number[]):IHistData[] {
  var data = [],
    cols = d3.scale.linear<string, string>().domain(range).range(['#111111', '#999999']),
    total = hist.validCount,
    binWidth = (range[1] - range[0]) / hist.bins,
    acc = 0;
  hist.forEach((b, i) => {
    data[i] = {
      v: b,
      acc: acc,
      ratio: b / total,
      range: hist.range(i),

      name: 'Bin ' + (i + 1) + ' (center: ' + d3.round((i + 0.5) * binWidth, 2) + ')',
      color: cols((i + 0.5) * binWidth)
    };
    acc += b;
  });
  return data;
}

function createHistData(hist:IHistogram, desc:IDataDescription, data:IDataType) {
  if (desc.type === 'stratification') {
    return createCategoricalHistData(<ICatHistogram>hist);
  }
  if ((<any>data).valuetype.type === 'categorical') {
    return createCategoricalHistData(<ICatHistogram>hist);
  }
  return createNumericalHistData(hist, (<any>data).valuetype.range);
}

function resolveHistMax(hist, totalHeight):Promise<number> {
  var op = d3.functor(totalHeight);
  return Promise.resolve<number>(op(hist)).then(function (r:any) {
    if (r === true) {
      return hist.validCount;
    }
    if (r === false) {
      return hist.largestBin;
    }
    return r;
  });
}

export interface IHistable extends IDataType {
  hist(nbins?:number): Promise<IHistogram>;
  length: number;
}

export class Histogram extends AVisInstance implements IVisInstance {
  private options = {
    nbins: 5,
    total: true,
    duration: 200,
    scale: [1, 1],
    rotate: 0
  };

  private $node:d3.Selection<Histogram>;

  private xscale:d3.scale.Ordinal<number, number>;
  private yscale:d3.scale.Linear<number, number>;

  private hist:IHistogram;
  private hist_data:IHistData[];

  constructor(public data:IHistable, parent:Element, options:any = {}) {
    super();
    mixin(this.options, {
      nbins: Math.floor(Math.sqrt(data.length)),
    }, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
    assignVis(<Element>this.$node.node(), this);
  }

  get rawSize():[number, number] {
    return [200, 100];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent:d3.Selection<any>) {
    const size = this.size,
      data = this.data,
      o = this.options;

    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-histogram'
    });
    const $t = $svg.append('g');
    const $data = $t.append('g');
    const $highlight = $t.append('g').style('pointer-events', 'none').classed('phovea-select-selected', true);

    //using range bands with an ordinal scale for uniform distribution
    const xscale = this.xscale = d3.scale.ordinal<number,number>().rangeBands([0, size[0]], 0.1);
    const yscale = this.yscale = d3.scale.linear().range([0, size[1]]);

    const l = (event:any, type:string, selected:Range) => {
      if (!this.hist_data) {
        return;
      }
      const highlights = this.hist_data.map((entry, i) => {
        var s = entry.range.intersect(selected);
        return {
          i: i,
          v: s.size()[0]
        };
      }).filter((entry) => entry.v > 0);
      var $m = $highlight.selectAll('rect').data(highlights);
      $m.enter().append('rect').attr('width', xscale.rangeBand());
      $m.attr({
        x: function (d) {
          return xscale(d.i);
        },
        y: function (d) {
          return yscale(yscale.domain()[1] - d.v);
        },
        height: 0
      });
      $m.transition().duration(o.duration).attr('height', function (d) {
        return yscale(d.v);
      });
      $m.exit().remove();
    };
    data.on('select', l);
    onDOMNodeRemoved(<Element>$data.node(), function () {
      data.off('select', l);
    });

    const onClick = (d) => data.select(0, d.range, toSelectOperation(d3.event));

    this.data.hist(Math.floor(o.nbins)).then((hist) => {
      this.hist = hist;
      xscale.domain(d3.range(hist.bins));
      return resolveHistMax(hist, this.options.total);
    }).then((hist_max) => {
      var hist = this.hist;
      yscale.domain([0, hist_max]);
      var hist_data = this.hist_data = createHistData(hist, this.data.desc, this.data);

      var $m = $data.selectAll('rect').data(hist_data);
      $m.enter().append('rect')
        .attr('width', xscale.rangeBand())
        .call(bindTooltip<IHistData>((d) => {
          return d.name + ' ' + (d.v) + ' entries (' + Math.round(d.ratio * 100) + '%)';
        }))
        .on('click', onClick);
      $m.attr({
        x: (d, i) => xscale(i),
        fill: (d) => d.color,
        y: (d) => yscale(yscale.domain()[1] - d.v),
        height: (d) => yscale(d.v)
      });
      this.markReady();
      data.selections().then((selected) => {
        l(null, 'selected', selected);
      });
    });

    return $svg;
  }

  locateImpl(range:Range) {
    var that = this, size = this.rawSize;
    if (range.isAll || range.isNone) {
      return Promise.resolve({x: 0, y: 0, w: size[0], h: size[1]});
    }
    return (<any>this.data).data(range).then(function (data) {
      var ex = d3.extent(data, function (value) {
        return that.hist.binOf(value);
      });
      var h0 = that.hist_data[ex[0]];
      var h1 = that.hist_data[ex[1]];
      return Promise.resolve({
        x: that.xscale(ex[0]),
        width: (that.xscale(ex[1]) - that.xscale(ex[0]) + that.xscale.rangeBand()),
        height: that.yscale(Math.max(h0.v, h1.v)),
        y: that.yscale(that.yscale.domain()[1] - Math.max(h0.v, h1.v))
      });
    });
  }

  transform(scale?:number[], rotate?:number):ITransform {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    var size = this.rawSize;
    this.$node.attr({
      width: size[0] * scale[0],
      height: size[1] * scale[1]
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
}

export class Mosaic extends AVisInstance implements IVisInstance {
  private options = {
    width: 20,
    initialScale: 10,
    duration: 200,
    heightTo: null,
    selectAble: true,
    scale: [1, 1],
    rotate: 0
  };

  private $node:d3.Selection<Mosaic>;

  private hist:IHistogram;
  private hist_data:IHistData[];

  constructor(public data:IHistable, parent:Element, options:any = {}) {
    super();
    mixin(this.options, {
      scale: [1, this.options.initialScale]
    }, options);

    if (this.options.heightTo) {
      this.options.scale[1] = this.options.heightTo / this.data.dim[0];
    }

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
  }

  get rawSize():[number, number] {
    return [this.options.width, this.data.dim[0]];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent:d3.Selection<any>) {
    const size = this.size,
      data = this.data,
      o = this.options;

    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-mosaic'
    });
    const $scale = $svg.append('g').attr('transform', 'scale(' + o.scale[0] + ',' + o.scale[1] + ')');
    const $data = $scale.append('g');
    const $highlight = $scale.append('g').style('pointer-events', 'none').classed('phovea-select-selected', true);

    const l = (event:any, type:string, selected:Range) => {
      if (!this.hist_data) {
        return;
      }
      var highlights = this.hist_data.map((entry, i) => {
        var s = entry.range.intersect(selected);
        return {
          i: i,
          acc: entry.acc,
          v: s.size()[0]
        };
      }).filter((entry) => entry.v > 0);
      var $m = $highlight.selectAll('rect').data(highlights);
      $m.enter().append('rect').attr('width', '100%').classed('phovea-select-selected', true);
      $m.attr({
        y: (d) => d.acc,
        height: (d) => d.v
      }).style('opacity', 0);
      $m.transition().duration(o.duration).style('opacity', 1);
      $m.exit().remove();
    };
    if (o.selectAble) {
      data.on('select', l);
      onDOMNodeRemoved(<Element>$data.node(), function () {
        data.off('select', l);
      });
    }

    const onClick = o.selectAble ? (d) => {
      data.select(0, d.range, toSelectOperation(d3.event));
    } : null;

    this.data.hist().then((hist) => {
      this.hist = hist;
      var hist_data = this.hist_data = createHistData(hist, data.desc, data);

      var $m = $data.selectAll('rect').data(hist_data);
      $m.enter().append('rect')
        .attr('width', '100%')
        .call(bindTooltip<IHistData>(function (d) {
          return d.name + ' ' + (d.v) + ' entries (' + Math.round(d.ratio * 100) + '%)';
        }))
        .on('click', onClick);
      $m.attr({
        y: (d) => d.acc,
        height: (d) => d.v,
        fill: (d) => d.color
      });
      this.fire('built');
      this.markReady();
      if (o.selectAble) {
        data.selections().then((selected) => {
          l(null, 'selected', selected);
        });
      }
    });

    return $svg;
  }

  locateImpl(range:Range) {
    var that = this;
    if (range.isAll || range.isNone) {
      return Promise.resolve({x: 0, y: 0, w: this.rawSize[0], h: (<any>this.data).length});
    }
    return (<any>this.data).data(range).then((data) => {
      var ex = d3.extent(data, function (value) {
        return that.hist.binOf(value);
      });
      var h0 = that.hist_data[ex[0]];
      var h1 = that.hist_data[ex[1]];
      var y = Math.min(h0.acc, h1.acc);
      var y2 = Math.max(h0.acc + h0.v, h1.acc + h1.v);
      return Promise.resolve({
        x: 0,
        width: that.rawSize[0],
        height: y2 - y,
        y: y
      });
    });
  }

  transform(scale?:number[], rotate?:number):ITransform {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    var size = this.rawSize;
    this.$node.attr({
      width: size[0] * scale[0],
      height: size[1] * scale[1]
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
}

function toPolygon(start:number, end:number, radius:number) {
  var r = [
    vec2(radius, radius),
    vec2(radius + Math.cos(start) * radius, radius + Math.sin(start) * radius),
    vec2(radius + Math.cos(end) * radius, radius + Math.sin(end) * radius)
  ];
  //approximate by triangle
  if (end - start > Math.PI) { //more than 180 degree use one more point
    r.splice(2, 0, vec2(radius + Math.cos((end - start) * 0.5) * radius, radius + Math.sin((end - start) * 0.5) * radius));
  }
  return polygon(r);
}

interface IRadialHistData {
  name: string;
  start: number;
  size: number;
  ratio: number;
  end: number;
  color: string;
  range: Range;
}

interface IRadialHistHelper {
  start: number;
  end: number;
}

export class Pie extends AVisInstance implements IVisInstance {
  private options = {
    radius: 50,
    innerRadius: 0,
    duration: 200,
    total: true,
    scale: [1, 1],
    rotate: 0
  };

  private $node:d3.Selection<Mosaic>;

  private scale:d3.scale.Linear<number, number>;
  private arc:d3.svg.Arc<IRadialHistHelper>;

  private hist:ICatHistogram;
  private hist_data:IRadialHistData[];

  constructor(public data:IHistable, parent:Element, options:any = {}) {
    super();
    mixin(this.options, options);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(this);
  }

  get rawSize():[number, number] {
    var r = this.options.radius;
    return [r * 2, r * 2];
  }

  get node() {
    return <Element>this.$node.node();
  }

  private build($parent:d3.Selection<any>) {
    const size = this.size,
      data = this.data,
      o = this.options;

    const $svg = $parent.append('svg').attr({
      width: size[0],
      height: size[1],
      'class': 'phovea-pie'
    });
    var $base = $svg.append('g').attr('transform', 'translate(' + o.radius + ',' + o.radius + ')');
    var $data = $base.append('g');
    var $highlight = $base.append('g').style('pointer-events', 'none').classed('phovea-select-selected', true);

    var scale = this.scale = d3.scale.linear().range([0, 2 * Math.PI]);
    var arc = this.arc = d3.svg.arc<IRadialHistData>().innerRadius(o.innerRadius).outerRadius(o.radius)
      .startAngle((d) => scale(d.start))
      .endAngle((d) => scale(d.end));

    var l = (event, type, selected) => {
      if (!this.hist_data) {
        return;
      }
      var highlights = this.hist_data.map((entry) => {
        var s = entry.range.intersect(selected);
        return {
          start: entry.start,
          end: entry.start + s.size()[0]
        };
      }).filter((entry) => entry.start < entry.end);
      var $m = $highlight.selectAll('path').data(highlights);
      $m.enter().append('path');
      $m.exit().remove();
      $m.attr('d', arc);
    };
    data.on('select', l);
    onDOMNodeRemoved(<Element>$data.node(), function () {
      data.off('select', l);
    });

    data.hist().then((hist) => {
      this.hist = <ICatHistogram>hist;
      return resolveHistMax(hist, this.options.total);
    }).then((total) => {
      var hist = this.hist;
      scale.domain([0, total]);
      var hist_data = this.hist_data = [], prev = 0, cats:any[] = hist.categories;

      var cols = hist.colors || d3.scale.category10().range();
      hist.forEach(function (b, i) {
        hist_data[i] = {
          name: (typeof cats[i] === 'string') ? cats[i] : cats[i].name,
          start: prev,
          size: b,
          ratio: b / total,
          end: prev + b,
          color: (cats[i].color === undefined) ? cols[i] : cats[i].color,
          range: hist.range(i)
        };
        prev += b;
      });
      var $m = $data.selectAll('path').data(hist_data);
      $m.enter()
        .append('path')
        .call(bindTooltip<IRadialHistData>((d) => d.name + ' ' + (d.size) + ' entries (' + Math.round(d.ratio * 100) + '%)'))
        .on('click', (d) => data.select(0, d.range, toSelectOperation(d3.event)));
      $m.attr('d', arc)
        .attr('fill', (d) => d.color)
        .style('opacity', 0);
      //fade in animation
      $m.transition()
        .duration(o.duration)
        .delay((d, i) => i * o.duration)
        .style('opacity', 1);

      this.markReady();
      data.selections().then((selected) => l(null, 'selected', selected));
    });
    return $svg;
  }

  locateImpl(range:Range) {
    const that = this, o = this.options;
    if (range.isAll || range.isNone) {
      return Promise.resolve({x: o.radius, y: o.radius, radius: o.radius});
    }
    return (<any>this.data).data(range).then(function (data) {
      var ex = d3.extent(data, function (value) {
        return that.hist.binOf(value);
      });
      var startAngle = that.scale(that.hist_data[ex[0]].start);
      var endAngle = that.scale(that.hist_data[ex[1]].end);
      return Promise.resolve(toPolygon(startAngle, endAngle, o.radius));
    });
  }

  transform(scale?:number[], rotate?:number):ITransform {
    var bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    this.$node.attr({
      width: this.options.radius * 2 * scale[0],
      height: this.options.radius * 2 * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')translate(' + this.options.radius + ',' + this.options.radius + ')');

    var new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform', new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }


  //updatedOption (name, value) {
  //  if (name === 'innerRadius' || name === 'radius' || name === 'total') {
  //    this.updateVis();
  //  }
  //}
  //private updateVis() {
  //  const o = this.options;
  //  this.arc.innerRadius(o.innerRadius).outerRadius(o.radius);
  //  this.scale.domain([0, o.total || this.hist.count]);
  //
  //  this.$node.selectAll('path').transition().attr('d', this.arc);
  //}
}

export function create(data:IHistable, parent:Element, options?) {
  return new Histogram(data, parent, options);
}
export function createMosaic(data:IHistable, parent:Element, options?) {
  return new Mosaic(data, parent, options);
}
export function createPie(data:IHistable, parent:Element, options?) {
  return new Pie(data, parent, options);
}
