/**
 * Created by Samuel Gratzl on 26.12.2016.
 */


import * as d3 from 'd3';
import {Range} from 'tdp_core';
import {IHeatMapUrlOptions} from 'tdp_core';
import {ICommonHeatMapOptions} from './ICommonHeatMapOptions';
import {IScale} from './IScale';
import {IHeatMapRenderer, ESelectOption} from './IHeatMapRenderer';
import {AHeatMapCanvasRenderer} from './AHeatMapCanvasRenderer';
import {IHeatMapAbleMatrix} from './HeatMap';
import {AppContext, Ajax} from 'tdp_core';
import {ParseRangeUtils} from 'tdp_core';
import {MatrixLoaderHelper} from 'tdp_core';

export class HeatMapImageRenderer extends AHeatMapCanvasRenderer implements IHeatMapRenderer {
  private image: HTMLImageElement;
  private ready = false;
  private color: IScale;

  constructor(selectAble = ESelectOption.CELL, options: ICommonHeatMapOptions) {
    super(selectAble, options);
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

  redraw($node: d3.Selection<any>, scale: number[]) {
    if (this.ready) {
      this.redrawImpl($node, scale);
    }
  }

  private redrawImpl($root: d3.Selection<any>, scale: number[]) {
    const canvas = <HTMLCanvasElement>$root.select('canvas').node();
    const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

    (<any>ctx).msImageSmoothingEnabled = false;
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

  recolor($node: d3.Selection<any>, data: IHeatMapAbleMatrix, color: IScale, scale: number[]) {
    //can't do that
    this.color = color;
    this.redrawImpl($node, scale);
  }


  build(data: IHeatMapAbleMatrix, $parent: d3.Selection<any>, scale: [number, number], c: IScale, onReady: () => void) {
    this.color = c;
    const dims = data.dim;
    const width = dims[1], height = dims[0];

    const $root = $parent.append('div').attr('class', 'phovea-heatmap');
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
    const domain = c.domain();
    const args: IHeatMapUrlOptions = {
      range: [domain[0], domain[domain.length - 1]],
      missing: HeatMapImageRenderer.ensureHex(this.options.missingColor)
    };

    function arrEqual(a: any[], b: any[]) {
      if (a.length !== b.length) {
        return false;
      }
      return a.every((ai, i) => ai === b[i]);
    }

    const colors = c.range();
    if (arrEqual(colors, ['black', 'white'])) {
      //default scale
    } else if (arrEqual(colors, ['white', 'red'])) {
      args.palette = 'white_red';
    } else if (arrEqual(colors, ['blue', 'white', 'red'])) {
      args.palette = 'blue_white_red';
    } else if (colors.length === 2 || colors.length === 3) {
      args.palette = colors.map(HeatMapImageRenderer.ensureHex).join('-');
    }

    // persist to get range and create range object again
    // TODO: make range property on matrix public
    const range = ParseRangeUtils.parseRange(data.persist().range);
    const params = MatrixLoaderHelper.prepareHeatmapUrlParameter(range, args);
    const url = `/dataset/matrix/${data.desc.id}/data`;

    const encoded = Ajax.encodeParams(params);
    if (encoded && (url.length + encoded.length >= Ajax.MAX_URL_LENGTH)) {
      // use post instead
      AppContext.getInstance().sendAPI(url, params, 'POST', 'blob').then((image) => {
        const imageURL = window.URL.createObjectURL(image);
        this.image.src = imageURL;
      });
    } else {
      this.image.src = data.heatmapUrl(Range.all(), args);
    }

    super.buildSelection(data, $root, scale);

    return $root;
  }

  static ensureHex(color: string) {
    const rgb = d3.rgb(color);
    const toHex = (d: number) => ('00' + d.toString(16)).slice(-2);
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
}
