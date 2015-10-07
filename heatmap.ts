/**
 * Created by Samuel Gratzl on 05.08.2014.
 */
/// <amd-dependency path='css!./style' />

/* global define */
'use strict';

import d3 = require('d3');
import d3utils = require('../caleydo_d3/d3util');
import ajax = require('../caleydo_core/ajax');
import vis = require('../caleydo_core/vis');
import matrix = require('../caleydo_core/matrix');
import vector = require('../caleydo_core/vector');
import datatypes = require('../caleydo_core/datatype');

import idtypes = require('../caleydo_core/idtype');
import geom = require('../caleydo_core/geom');
import ranges = require('../caleydo_core/range');
import C = require('../caleydo_core/main');


function defaultColor(value: any) {
  if (value.type === 'categorical') {
    return value.categories.map((c) => c.color);
  }
  return ['black', 'white'];
}
function defaultDomain(value) {
  if (value.type === 'categorical') {
    return value.categories.map((c) => c.name);
  }
  return value.range;
}

interface IScale {
  (x : any): any;
  domain(): any[];
  domain(values: any[]) : IScale;

  range(): any[];
  range(values: any[]): IScale;
}

function toScale(value): IScale {
  if (value.type === 'categorical') {
    return d3.scale.ordinal();
  }
  return d3.scale.linear();
}

interface IHeatMapRenderer {
  rescale($node: d3.Selection<any>, dim: number[], scale: number[]);
  redraw($node: d3.Selection<any>, scale: number[]);
  recolor($node: d3.Selection<any>, data: matrix.IMatrix, color: IScale, scale: number[]);
  build(data: matrix.IMatrix, $parent: d3.Selection<any>, initialScale: number, c: IScale, onReady: () => void);
}

class HeatMapDOMRenderer implements IHeatMapRenderer {
  private color: IScale;

  constructor(private selectAble = true) {

  }

  rescale($node: d3.Selection<any>, dim: number[], scale: number[]) {
    $node.attr({
      width: dim[1] * scale[0],
      height: dim[0] * scale[1]
    });
    $node.select('g').attr('transform','scale('+scale[0]+','+scale[1]+')');
  }

  recolor($node: d3.Selection<any>, data: matrix.IMatrix, color: IScale, scale: number[]) {
    this.color = color;
    $node.selectAll('rect').attr('fill', (d) => color(d));
  }

  redraw($node: d3.Selection<any>, scale: number[]) {
    $node.selectAll('rect').attr('fill', (d) => this.color(d));
  }

  build(data: matrix.IMatrix, $parent: d3.Selection<any>, initialScale: number, c: IScale, onReady: () => void) {
    var dims = data.dim, that = this;
    var width = dims[1], height = dims[0];

    var $svg = $parent.append('svg').attr({
      width: width * initialScale,
      height: height * initialScale,
      'class': 'heatmap'
    });
    var $g = $svg.append('g').attr('transform','scale('+initialScale+','+initialScale+')');
    this.color = c;

    data.data().then((arr) => {
      var $rows = $g.selectAll('g').data(arr);
      $rows.enter().append('g').each(function (row, i) {
        var $cols = d3.select(this).selectAll('rect').data(row);
        const $cols_enter = $cols.enter().append('rect').attr({
          width: 1,
          height: 1,
          x: (d, j) => j,
          y: i,
          fill: (d) => c(d)
        });
        if (that.selectAble) {
          $cols_enter.on('click', (d, j) => {
            data.select([
              [i],
              [j]
            ], idtypes.toSelectOperation(d3.event));
          });
        }
        $cols_enter.append('title').text(String);

      });
      onReady();
    });
    var l = function (event, type, selected: ranges.Range) {
      $g.selectAll('rect').classed('select-' + type, false);
      if (selected.isNone) {
        return;
      }
      var dim0 = selected.dim(0), dim1 = selected.dim(1);
      if (selected.isAll) {
        $g.selectAll('rect').classed('select-' + type, true);
      } else if (dim0.isAll || dim0.isNone) {
        dim1.forEach((j) => {
          $g.selectAll('g > rect:nth-child(' + (j + 1) + ')').classed('select-' + type, true);
        });
      } else if (dim1.isAll || dim1.isNone) {
        dim0.forEach((i) => {
          $g.selectAll('g:nth-child(' + (i + 1) + ') > rect').classed('select-' + type, true);
        });
      } else {
        dim0.forEach((i) => {
          var row = $g.select('g:nth-child(' + (i + 1) + ')');
          dim1.forEach((j) => {
            row.select('rect:nth-child(' + (j + 1) + ')').classed('select-' + type, true);
          });
        });
      }
    };
    if (this.selectAble) {
      data.on('select', l);
      C.onDOMNodeRemoved(<Element>$g.node(), function () {
        data.off('select', l);
      });
      data.selections().then(function (selected) {
        l(null, 'selected', selected);
      });
    }

    return $svg;
  }
}


class AHeatMapCanvasRenderer {

  constructor(protected selectAble = true) {

  }

  rescale($node: d3.Selection<any>, dim: number[], scale: number[]) {
    $node.selectAll('canvas.heatmap-selection').attr({
      width: dim[1] * scale[0],
      height: dim[0] * scale[1]
    });
    if (this.selectAble) {
      $node.datum().selections().then((selected) => {
        this.redrawSelection(<HTMLCanvasElement>$node.select('canvas.heatmap-selection').node(), dim,
          'selected', selected);
      });
    }
  }

  protected redrawSelection(canvas: HTMLCanvasElement, dim: number[], type: string, selected: ranges.Range) {
    var ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'orange';
    if (selected.isNone) {
      ctx.restore();
      return;
    }
    if (selected.isAll) {
      ctx.fillRect(0,0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }
    var dim0 = selected.dim(0), dim1 = selected.dim(1);
    ctx.scale(canvas.width / dim[1], canvas.height / dim[0]);

    if (dim0.isAll || dim0.isNone) {
      dim1.forEach((j) => { //column
        ctx.fillRect(j, 0, 1, dim[0]);
      });
    } else if (dim1.isAll || dim1.isNone) {
      dim0.forEach((i) => { //rows
        ctx.fillRect(0, i, dim[1], 1);
      });
    } else {
      dim0.forEach((i) => {
        dim1.forEach((j) => {
          ctx.fillRect(j,i, 1, 1);
        });
      });
    }
    ctx.restore();

  }

  protected buildSelection(data: matrix.IMatrix, $root: d3.Selection<any>, initialScale: number) {
    if (!this.selectAble) {
      return;
    }
    const dims = data.dim;
    const width = dims[1], height = dims[0];

    const $selection = $root.append('canvas').attr({
      width: width * initialScale,
      height: height * initialScale,
      'class': 'heatmap-selection'
    });

    var toCoord = (evt) => {
      var c = <HTMLCanvasElement>$selection.node(),
        rect = c.getBoundingClientRect();
      var x = evt.clientX - rect.left,
          y = evt.clientY - rect.top;
      var i = Math.floor(width * x / c.width),
        j = Math.floor(height * y / c.height);
      return [j,i];
    };

    $selection.on('click', () => {
      var ij = toCoord(d3.event);
      data.select([[ij[0]], [ij[1]]], idtypes.toSelectOperation(d3.event));
    });

    var l = (event, type, selected) => {
      this.redrawSelection(<HTMLCanvasElement>$selection.node(), dims, type, selected);
    };

    data.on('select', l);
    C.onDOMNodeRemoved(<Element>$selection.node(), () => {
      data.off('select', l);
    });
    data.selections().then((selected) => {
      this.redrawSelection(<HTMLCanvasElement>$selection.node(), dims, 'selected', selected);
    });
  }
}

class HeatMapCanvasRenderer extends AHeatMapCanvasRenderer implements IHeatMapRenderer {
  private imageData : ImageData;
  private ready = false;

  constructor(selectAble = true) {
    super(selectAble);
  }

  rescale($node: d3.Selection<any>, dim: number[], scale: number[]) {
    $node.selectAll('canvas').attr({
      width: dim[1] * scale[0],
      height: dim[0] * scale[1]
    });
    if (this.ready) {
      this.redrawImpl(this.imageData, $node, scale);
    }

    super.rescale($node, dim, scale);
  }

  redraw($node: d3.Selection<any>, scale: number[]) {
    if (this.ready) {
      this.redrawImpl(this.imageData, $node, scale);
    }
  }

  recolor($node: d3.Selection<any>, data: matrix.IMatrix, color: IScale, scale: number[]) {
    var rgba = this.imageData.data;
    if (this.ready) {
      data.data().then((arr) => {
        this.genImage(rgba, arr, data.ncol, color);
        this.redrawImpl(this.imageData, $node, scale);
      });
    }
  }

  private genImage(rgba: number[], arr: number[][], ncol: number, c: IScale) {
    arr.forEach((row, j) => {
      var t = j * ncol;
      row.forEach((cell, i) => {
        var color = d3.rgb(c(cell));
        rgba[(t+i)*4] = color.r;
        rgba[(t+i)*4 + 1] = color.g;
        rgba[(t+i)*4 + 2] = color.b;
        rgba[(t+i)*4 + 3] = 255;
      });
    });
  }

  private redrawImpl(imageData: ImageData, $root: d3.Selection<any>, scale: number[]) {
    var context = <CanvasRenderingContext2D>(<any>$root.select('canvas').node()).getContext('2d');

    context.msImageSmoothingEnabled = false;
    //if (context.hasOwnProperty('imageSmoothingEnabled')) {
    (<any>context).imageSmoothingEnabled = false;
    //}

    if (scale[0] === 1 && scale[1] === 1) {
      context.putImageData(imageData, 0, 0);
    } else {
      var tmp = document.createElement('canvas');
      tmp.width = imageData.width;
      tmp.height = imageData.height;

      var d = <CanvasRenderingContext2D>tmp.getContext('2d');
      d.putImageData(imageData, 0, 0);
      context.save();
      context.scale(scale[0], scale[1]);
      context.drawImage(tmp, 0, 0);
      context.restore();
      d3.select(tmp).remove();
    }
  }


  build(data: matrix.IMatrix, $parent: d3.Selection<any>, initialScale: number, c: IScale, onReady: () => void) {

    var dims = data.dim;
    var width = dims[1], height = dims[0];

    var $root = $parent.append('div').attr('class','heatmap');
    var $canvas = $root.append('canvas').attr({
      width: width * initialScale,
      height: height * initialScale,
      'class': 'heatmap-data'
    });

    this.imageData = (<CanvasRenderingContext2D>(<HTMLCanvasElement>$canvas.node()).getContext('2d')).createImageData(width, height);//new (<any>ImageData)(data.ncol, data.nrow);
    var rgba = this.imageData.data;
    data.data().then((arr) => {
      this.ready = true;
      this.genImage(rgba, arr, data.ncol, c);
      onReady();
    });

    super.buildSelection(data, $root, initialScale);

    return $root;

  }
}


class HeatMapImageRenderer extends AHeatMapCanvasRenderer implements IHeatMapRenderer {
  private image: HTMLImageElement;
  private ready = false;
  private color: IScale;

  constructor(selectAble = true) {
    super(selectAble);
  }

  rescale($node: d3.Selection<any>, dim: number[], scale: number[]) {
    $node.selectAll('canvas').attr({
      width: dim[1] * scale[0],
      height: dim[0] * scale[1]
    });
    if (this.ready) {
      this.redrawImpl($node, scale);
    }

    super.rescale($node, dim, scale);
  }

  redraw($node:d3.Selection<any>, scale:number[]) {
    if (this.ready) {
      this.redrawImpl($node, scale);
    }
  }

  private redrawImpl($root: d3.Selection<any>, scale: number[]) {
    const canvas = <HTMLCanvasElement>$root.select('canvas').node();
    const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

    ctx.msImageSmoothingEnabled = false;
    //if (context.hasOwnProperty('imageSmoothingEnabled')) {
    (<any>ctx).imageSmoothingEnabled = false;
    //}

    if (scale[0] === 1 && scale[1] === 1) {
      ctx.drawImage(this.image, 0, 0);
    } else {
      ctx.save();
      ctx.scale(scale[0], scale[1]);
      //console.log('draw with scale', scale, this.image.width, this.image.height);
      ctx.drawImage(this.image, 0, 0);
      ctx.restore();
    }

    //apply color scale
    if (false) { //FIXME
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;
      var help  = d3.scale.linear().domain([0,255]).range(this.color.domain());
      for (let i = 0; i < data.length; i += 4) {
        //gray scale
        let v = data[i];
        //to convert to domain value or use a different scale
        var color = d3.rgb(this.color(help(v)));
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }

  recolor($node: d3.Selection<any>, data: matrix.IMatrix, color: IScale, scale: number[]) {
    //can't do that
    this.color = color;
    this.redrawImpl($node, scale);
  }


  build(data: matrix.IMatrix, $parent: d3.Selection<any>, initialScale: number, c: IScale, onReady: () => void) {
    this.color = c;
    var dims = data.dim;
    var width = dims[1], height = dims[0];

    var $root = $parent.append('div').attr('class','heatmap');
    $root.append('canvas').attr({
      width: width * initialScale,
      height: height * initialScale,
      'class': 'heatmap-data'
    });

    this.image = new Image();
    this.image.onload = () => {
      this.ready = true;
      onReady();
    };
    this.image.src = data.heatmapUrl(ranges.all(), {
      range: <[number,number]>c.domain()
    });

    super.buildSelection(data, $root, initialScale);

    return $root;

  }
}

function createRenderer(cells: number, selectAble = true): IHeatMapRenderer {
  if (cells <= 1000) {
    return new HeatMapDOMRenderer(selectAble);
  } else if (cells < 5000) {
    return new HeatMapCanvasRenderer(selectAble);
  } else {
    return new HeatMapImageRenderer(selectAble);
  }
}

export class HeatMap extends vis.AVisInstance implements vis.IVisInstance {
  private $node:d3.Selection<any>;
  private colorer : IScale;
  private renderer: IHeatMapRenderer;

  constructor(public data:matrix.IMatrix, public parent:Element, private options: any) {
    super();
    var value = (<any>this.data.desc).value;
    this.options = C.mixin({
      initialScale: 10,
      color: defaultColor(value),
      domain: defaultDomain(value),
      duration : 200,
      selectAble: true
    }, options);
    this.options.scale = [this.options.initialScale,this.options.initialScale];
    this.options.rotate = 0;
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);

    this.renderer = createRenderer(data.length, this.options.selectAble);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    vis.assignVis(<Element>this.$node.node(), this);
  }

  get rawSize(): [number, number] {
    var d = this.data.dim;
    return [d[1], d[0]];
  }

  get node() {
    return <Element>this.$node.node();
  }

  option(name: string, val? : any) {
    if (arguments.length === 1) {
      return this.options[name];
    } else {
      this.fire('option', name, val, this.options[name]);
      this.fire('option.'+name, val, this.options[name]);
      this.options[name] = val;
      switch(name) {
        case 'color':
        case 'domain':
          this.recolor();
          break;
      }
    }
  }

  locateImpl(range:ranges.Range) {
    var dims = this.data.dim;
    var width = dims[1], height = dims[0], o = this.options;

    function l(r, max, s) {
      if (r.isAll || r.isNone) {
        return [0, max * s];
      }
      var ex:any = d3.extent(r.iter().asList());
      return [ex[0] * s, (ex[1] - ex[0] + 1) * s];
    }

    var xw = l(range.dim(1), width, o.scale[0]);
    var yh = l(range.dim(0), height, o.scale[1]);
    return Promise.resolve(geom.rect(xw[0], yh[0], xw[1], yh[1]));
  }

  transform(scale?: number[], rotate: number = 0) {
    var bak = {
      scale: this.options.scale || [1,1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    var dims = this.data.dim;
    this.$node.style('transform','rotate('+rotate+'deg)');
    this.renderer.rescale(this.$node, dims, scale);
    var new_ = {
      scale: scale,
      rotate: rotate
    };
    this.fire('transform',new_, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return new_;
  }

  private recolor() {
    var c = this.colorer;
    c.domain(this.options.domain).range(this.options.color);
    this.renderer.recolor(this.$node, this.data, c, this.options.scale);
  }

  private build($parent:d3.Selection<any>) {
    return this.renderer.build(this.data, $parent, this.options.initialScale, this.colorer, () => {
      this.renderer.redraw(this.$node, this.options.scale);
      this.markReady();
    });
  }
}


export class HeatMap1D extends vis.AVisInstance implements vis.IVisInstance {
  private $node:d3.Selection<any>;
  private colorer:IScale;

  constructor(public data:vector.IVector, public parent:Element, private options:any) {
    super();
    var value = (<any>this.data.desc).value;
    this.options = C.mixin({
      initialScale: 10,
      color: defaultColor(value),
      domain: defaultDomain(value),
      width: 20
    }, options);
    this.options.scale = [1, this.options.initialScale];
    this.options.rotate = 0;
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    vis.assignVis(<Element>this.$node.node(), this);
  }

  get rawSize(): [number, number] {
    var d = this.data.dim;
    return [this.options.width, d[0]];
  }

  get node() {
    return <Element>this.$node.node();
  }

  option(name:string, val?:any) {
    if (arguments.length === 1) {
      return this.options[name];
    } else {
      this.fire('option', name, val, this.options[name]);
      this.fire('option.' + name, val, this.options[name]);
      this.options[name] = val;
      switch (name) {
        case 'color':
        case 'domain':
          this.recolor();
          break;
      }
    }
  }

  locateImpl(range:ranges.Range) {
    var dims = this.data.dim;
    var height = dims[0];

    function l(r, max, s) {
      if (r.isAll || r.isNone) {
        return [0, max * s];
      }
      var ex:any = d3.extent(r.iter().asList());
      return [ex[0] * s, (ex[1] - ex[0] + 1) * s];
    }

    var yh = l(range.dim(0), height, this.options.scale[1]);
    return Promise.resolve(geom.rect(0, yh[0], 20, yh[1]));
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
    var width = this.options.width, height = dims[0];
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

  private recolor() {
    var c = this.colorer;
    c.domain(this.options.domain).range(this.options.color);
    this.$node.selectAll('rect').attr('fill', (d) => c(d));
  }

  private build($parent:d3.Selection<any>) {
    var dims = this.data.dim;
    var width = this.options.width, height = dims[0];
    var $svg = $parent.append('svg').attr({
      width: width,
      height: height * this.options.initialScale,
      'class': 'heatmap'
    });
    var $g = $svg.append('g').attr('transform', 'scale(1,' + this.options.initialScale + ')');

    var c = this.colorer;
    var data = this.data;


    data.data().then((arr) => {
      var $rows = $g.selectAll('rect').data(arr);
      var onClick = d3utils.selectionUtil(data, $g, 'rect');
      $rows.enter().append('rect').on('click', onClick).attr({
        width: this.options.width,
        height: 1
      }).append('title').text(C.identity);
      $rows.attr({
        fill: (d) => c(d),
        y: (d,i) => i
      });
      $rows.exit().remove();
    });
    return $svg;
  }
}

export function create(data:vector.IVector, parent:Element, options);
export function create(data:matrix.IMatrix, parent:Element, options);
export function create(data:datatypes.IDataType, parent:Element, options): vis.AVisInstance {
  if (data.desc.type === 'matrix') {
    return new HeatMap(<matrix.IMatrix>data, parent, options);
  } else if (data.desc.type === 'vector') {
    return new HeatMap1D(<vector.IVector>data, parent, options);
  }
  return null;
}
