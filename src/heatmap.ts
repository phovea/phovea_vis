/**
 * Created by Samuel Gratzl on 05.08.2014.
 */


import './style.scss';
import * as d3 from 'd3';
import {Range, all, cell} from 'phovea_core/src/range';
import {AVisInstance, IVisInstance, assignVis} from 'phovea_core/src/vis';
import {rect} from 'phovea_core/src/geom';
import {IDataType} from 'phovea_core/src/datatype';
import {identity, mixin, onDOMNodeRemoved} from 'phovea_core/src';
import {selectionUtil} from 'phovea_d3/src/d3util';
import {IMatrix} from 'phovea_core/src/matrix';
import {IVector} from 'phovea_core/src/vector';
import {toSelectOperation, defaultSelectionType} from 'phovea_core/src/idtype';


export function defaultColor(value: any) {
  if (value.type === 'categorical') {
    return value.categories.map((c) => c.color);
  }
  const r = value.range;
  if (r[0] < 0 && r[1] > 0) {
    //use a symmetric range
    return ['blue', 'white', 'red'];
  }
  return ['white', 'red'];
}
export function defaultDomain(value) {
  if (value.type === 'categorical') {
    return value.categories.map((c) => c.name);
  }
  const r = value.range;
  if (r[0] < 0 && r[1] > 0) {
    //use a symmetric range
    return [Math.min(r[0], -r[1]), 0, Math.max(-r[0], r[1])];
  }
  return r;
}

interface IScale {
  (x : any): any;
  domain(): any[];
  domain(values: any[]) : IScale;

  range(): any[];
  range(values: any[]): IScale;
}

export function toScale(value): IScale {
  if (value.type === 'categorical') {
    return d3.scale.ordinal();
  }
  return d3.scale.linear();
}

interface IHeatMapRenderer {
  rescale($node: d3.Selection<any>, dim: number[], scale: number[]);
  redraw($node: d3.Selection<any>, scale: number[]);
  recolor($node: d3.Selection<any>, data: IMatrix, color: IScale, scale: number[]);
  build(data: IMatrix, $parent: d3.Selection<any>, scale: [number,number], c: IScale, onReady: () => void);
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

  recolor($node: d3.Selection<any>, data: IMatrix, color: IScale, scale: number[]) {
    this.color = color;
    $node.selectAll('rect').attr('fill', (d) => color(d));
  }

  redraw($node: d3.Selection<any>, scale: number[]) {
    $node.selectAll('rect').attr('fill', (d) => this.color(d));
  }

  build(data: IMatrix, $parent: d3.Selection<any>, scale: [number,number], c: IScale, onReady: () => void) {
    var dims = data.dim, that = this;
    var width = dims[1], height = dims[0];

    var $svg = $parent.append('svg').attr({
      width: width * scale[0],
      height: height * scale[1],
      'class': 'phovea-heatmap'
    });
    var $g = $svg.append('g').attr('transform','scale('+scale[0]+','+scale[1]+')');
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
            data.selectProduct([cell(i,j)], toSelectOperation(d3.event));
          });
        }
        $cols_enter.append('title').text(String);

      });
      onReady();
    });
    var l = function (event, type, selected: Range[]) {
      $g.selectAll('rect').classed('phovea-select-' + type, false);
      if (selected.length === 0) {
        return;
      }
      selected.forEach((cell) => {
        cell.product((indices) => {
          $g.select(`g:nth-child(${indices[0] + 1})`).select(`rect:nth-child(${indices[1] + 1})`).classed('phovea-select-' + type, true);
        }, data.dim);
      });
    };
    if (this.selectAble) {
      data.on('selectProduct', l);
      onDOMNodeRemoved(<Element>$g.node(), function () {
        data.off('selectProduct', l);
      });
      data.productSelections().then(function (selected) {
        l(null, defaultSelectionType, selected);
      });
    }

    return $svg;
  }
}


class AHeatMapCanvasRenderer {

  constructor(protected selectAble = true) {

  }

  rescale($node: d3.Selection<any>, dim: number[], scale: number[]) {
    $node.selectAll('canvas.phovea-heatmap-selection').attr({
      width: dim[1] * scale[0],
      height: dim[0] * scale[1]
    });
    if (this.selectAble) {
      $node.datum().productSelections().then((selected) => {
        this.redrawSelection(<HTMLCanvasElement>$node.select('canvas.phovea-heatmap-selection').node(), dim,
          defaultSelectionType, selected);
      });
    }
  }

  protected redrawSelection(canvas: HTMLCanvasElement, dim: number[], type: string, selected: Range[]) {
    var ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'orange';
    if (selected.length === 0) {
      ctx.restore();
      return;
    }
    if (selected.some((a) => a.isAll)) {
      ctx.fillRect(0,0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }

    ctx.scale(canvas.width / dim[1], canvas.height / dim[0]);
    selected.forEach((cell) => {
      cell.product((indices) => {
        const [i,j] = indices;
        ctx.fillRect(j,i, 1, 1);
      }, dim);
    });
    ctx.restore();

  }

  protected buildSelection(data: IMatrix, $root: d3.Selection<any>, scale: [number,number]) {
    if (!this.selectAble) {
      return;
    }
    const dims = data.dim;
    const width = dims[1], height = dims[0];

    const $selection = $root.append('canvas').attr({
      width: width * scale[0],
      height: height * scale[1],
      'class': 'phovea-heatmap-selection'
    });

    var toCoord = (evt) : [number,number] => {
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
      data.selectProduct([cell(...ij)], toSelectOperation(d3.event));
    });

    var l = (event, type, selected) => {
      this.redrawSelection(<HTMLCanvasElement>$selection.node(), dims, type, selected);
    };

    data.on('selectProduct', l);
    onDOMNodeRemoved(<Element>$selection.node(), () => {
      data.off('selectProduct', l);
    });
    data.productSelections().then((selected) => {
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

  recolor($node: d3.Selection<any>, data: IMatrix, color: IScale, scale: number[]) {
    var rgba = this.imageData.data;
    if (this.ready) {
      data.data().then((arr) => {
        this.genImage(rgba, arr, data.ncol, color);
        this.redrawImpl(this.imageData, $node, scale);
      });
    }
  }

  private genImage(rgba: Uint8ClampedArray|number[], arr: number[][], ncol: number, c: IScale) {
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
      //don't nee
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


  build(data: IMatrix, $parent: d3.Selection<any>, scale: [number,number], c: IScale, onReady: () => void) {

    var dims = data.dim;
    var width = dims[1], height = dims[0];

    var $root = $parent.append('div').attr('class','phovea-heatmap');
    var $canvas = $root.append('canvas').attr({
      width: width * scale[0],
      height: height * scale[1],
      'class': 'phovea-heatmap-data'
    });

    this.imageData = (<CanvasRenderingContext2D>(<HTMLCanvasElement>$canvas.node()).getContext('2d')).createImageData(width, height);//new (<any>ImageData)(data.ncol, data.nrow);
    var rgba = this.imageData.data;
    data.data().then((arr) => {
      this.ready = true;
      this.genImage(rgba, arr, data.ncol, c);
      onReady();
    });

    super.buildSelection(data, $root, scale);

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
    /*if (false) { //FIXME
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
    }*/
  }

  recolor($node: d3.Selection<any>, data: IMatrix, color: IScale, scale: number[]) {
    //can't do that
    this.color = color;
    this.redrawImpl($node, scale);
  }


  build(data: IMatrix, $parent: d3.Selection<any>, scale: [number,number], c: IScale, onReady: () => void) {
    this.color = c;
    var dims = data.dim;
    var width = dims[1], height = dims[0];

    var $root = $parent.append('div').attr('class','phovea-heatmap');
    $root.append('canvas').attr({
      width: width * scale[0],
      height: height * scale[1],
      'class': 'phovea-heatmap-data'
    });

    this.image = new Image();
    this.image.onload = () => {
      this.ready = true;
      onReady();
    };
    var args: any = {
      range: <[number,number]>c.domain()
    };
    function arrEqual(a: any[], b: any[]) {
      if (a.length !== b.length) {
        return false;
      }
      return a.every((ai,i) => ai === b[i]);
    }
    const colors = c.range();
    if (arrEqual(colors, ['black', 'white'])) {
      //default scale
    } else if (arrEqual(colors, ['white', 'red'])) {
      args.palette = 'white_red';
    } else if (arrEqual(colors, ['blue', 'white', 'red'])) {
      args.palette = 'blue_white_red';
    }
    this.image.src = data.heatmapUrl(all(), args);

    super.buildSelection(data, $root, scale);

    return $root;

  }
}

function createRenderer(d: IMatrix, selectAble = true, forceThumbnails = false): IHeatMapRenderer {
  const cells = d.length;
  if (cells <= 1000) {
    return new HeatMapDOMRenderer(selectAble);
  }
  const url = d.heatmapUrl();
  if (url && forceThumbnails) {
    return new HeatMapImageRenderer(selectAble);
  } else if (cells < 5000 ||  url === null) {
    return new HeatMapCanvasRenderer(selectAble);
  } else {
    return new HeatMapImageRenderer(selectAble);
  }
}

export class HeatMap extends AVisInstance implements IVisInstance {
  private $node:d3.Selection<any>;
  private colorer : IScale;
  private renderer: IHeatMapRenderer;

  constructor(public data:IMatrix, public parent:Element, private options: any) {
    super();
    var value = (<any>this.data.desc).value;
    this.options = mixin({
      initialScale: 10,
      scaleTo: null,
      color: defaultColor(value),
      domain: defaultDomain(value),
      duration : 200,
      selectAble: true,
      forceThumbnails: false
    }, options);
    this.options.scale = [this.options.initialScale,this.options.initialScale];
    if (this.options.scaleTo) {
      let raw = this.data.dim;
      this.options.scale = this.options.scaleTo.map((d,i) => d / raw[i]);
    }
    this.options.rotate = 0;
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);

    this.renderer = createRenderer(data, this.options.selectAble, this.options.forceThumbnails);

    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    assignVis(<Element>this.$node.node(), this);
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

  locateImpl(range:Range) {
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
    return Promise.resolve(rect(xw[0], yh[0], xw[1], yh[1]));
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
    if (bak.scale[0] !== scale[0] || bak.scale[1] !== scale[1]) {
      this.renderer.rescale(this.$node, dims, scale);
    }
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
    return this.renderer.build(this.data, $parent, this.options.scale, this.colorer, () => {
      this.renderer.redraw(this.$node, this.options.scale);
      this.markReady();
    });
  }

  update() {
    this.renderer.redraw(this.$node, this.options.scale);
  }
}


export class HeatMap1D extends AVisInstance implements IVisInstance {
  private $node:d3.Selection<any>;
  private colorer:IScale;

  constructor(public data:IVector, public parent:Element, private options:any) {
    super();
    var value = (<any>this.data.desc).value;
    this.options = mixin({
      initialScale: 10,
      color: defaultColor(value),
      domain: defaultDomain(value),
      width: 20,
      heightTo: null
    }, options);
    this.options.scale = [1, this.options.initialScale];
    if (this.options.heightTo) {
      this.options.scale[1] = this.options.heightTo / this.data.dim[0];
    }
    this.options.rotate = 0;
    this.colorer = toScale(value).domain(this.options.domain).range(this.options.color);
    this.$node = this.build(d3.select(parent));
    this.$node.datum(data);
    assignVis(<Element>this.$node.node(), this);
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

  locateImpl(range:Range) {
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
    return Promise.resolve(rect(0, yh[0], 20, yh[1]));
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
      'class': 'phovea-heatmap'
    });
    var $g = $svg.append('g').attr('transform', 'scale(1,' + this.options.initialScale + ')');

    var c = this.colorer;
    var data = this.data;


    data.data().then((arr) => {
      var $rows = $g.selectAll('rect').data(arr);
      var onClick = selectionUtil(data, $g, 'rect');
      $rows.enter().append('rect').on('click', onClick).attr({
        width: this.options.width,
        height: 1
      }).append('title').text(identity);
      $rows.attr({
        fill: (d) => c(d),
        y: (d,i) => i
      });
      $rows.exit().remove();
    });
    return $svg;
  }

}

export function create(data:IVector, parent:Element, options);
export function create(data:IMatrix, parent:Element, options);
export function create(data:IDataType, parent:Element, options): AVisInstance {
  if (data.desc.type === 'matrix') {
    return new HeatMap(<IMatrix>data, parent, options);
  } else if (data.desc.type === 'vector') {
    return new HeatMap1D(<IVector>data, parent, options);
  }
  return null;
}
