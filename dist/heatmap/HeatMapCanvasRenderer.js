/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import * as d3 from 'd3';
import { DefaultUtils } from './DefaultUtils';
import { ESelectOption } from './IHeatMapRenderer';
import { AHeatMapCanvasRenderer } from './AHeatMapCanvasRenderer';
export class HeatMapCanvasRenderer extends AHeatMapCanvasRenderer {
    constructor(selectAble = ESelectOption.CELL, options) {
        super(selectAble, options);
        this.ready = false;
    }
    rescale($node, dim, scale) {
        $node.selectAll('canvas').attr({
            width: dim[1] * scale[0],
            height: dim[0] * scale[1]
        });
        if (this.ready) {
            this.redrawImpl(this.imageData, $node, scale);
        }
        super.rescale($node, dim, scale);
    }
    redraw($node, scale) {
        if (this.ready) {
            this.redrawImpl(this.imageData, $node, scale);
        }
    }
    recolor($node, data, color, scale) {
        const rgba = this.imageData.data;
        if (this.ready) {
            data.data().then((arr) => {
                this.genImage(rgba, arr, data.ncol, color);
                this.redrawImpl(this.imageData, $node, scale);
            });
        }
    }
    genImage(rgba, arr, ncol, c) {
        arr.forEach((row, j) => {
            const t = j * ncol;
            row.forEach((cell, i) => {
                const color = d3.rgb(DefaultUtils.isMissing(cell) ? this.options.missingColor : c(cell));
                rgba[(t + i) * 4] = color.r;
                rgba[(t + i) * 4 + 1] = color.g;
                rgba[(t + i) * 4 + 2] = color.b;
                rgba[(t + i) * 4 + 3] = 255;
            });
        });
    }
    redrawImpl(imageData, $root, scale) {
        const context = $root.select('canvas').node().getContext('2d');
        context.msImageSmoothingEnabled = false;
        //if (context.hasOwnProperty('imageSmoothingEnabled')) {
        context.imageSmoothingEnabled = false;
        //}
        if (scale[0] === 1 && scale[1] === 1) {
            //don't nee
            context.putImageData(imageData, 0, 0);
        }
        else {
            const tmp = $root.node().ownerDocument.createElement('canvas');
            tmp.width = imageData.width;
            tmp.height = imageData.height;
            const d = tmp.getContext('2d');
            d.putImageData(imageData, 0, 0);
            context.save();
            context.scale(scale[0], scale[1]);
            context.drawImage(tmp, 0, 0);
            context.restore();
            d3.select(tmp).remove();
        }
    }
    build(data, $parent, scale, c, onReady) {
        const dims = data.dim;
        const width = dims[1], height = dims[0];
        const $root = $parent.append('div').attr('class', 'phovea-heatmap');
        const $canvas = $root.append('canvas').attr({
            width: width * scale[0],
            height: height * scale[1],
            'class': 'phovea-heatmap-data'
        });
        this.imageData = $canvas.node().getContext('2d').createImageData(width, height); //new (<any>ImageData)(data.ncol, data.nrow);
        const rgba = this.imageData.data;
        data.data().then((arr) => {
            this.ready = true;
            this.genImage(rgba, arr, data.ncol, c);
            onReady();
        });
        super.buildSelection(data, $root, scale);
        return $root;
    }
}
//# sourceMappingURL=HeatMapCanvasRenderer.js.map