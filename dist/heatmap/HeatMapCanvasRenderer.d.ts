/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import * as d3 from 'd3';
import { ICommonHeatMapOptions } from './ICommonHeatMapOptions';
import { IScale } from './IScale';
import { IHeatMapRenderer, ESelectOption } from './IHeatMapRenderer';
import { AHeatMapCanvasRenderer } from './AHeatMapCanvasRenderer';
import { IHeatMapAbleMatrix } from './HeatMap';
export declare class HeatMapCanvasRenderer extends AHeatMapCanvasRenderer implements IHeatMapRenderer {
    private imageData;
    private ready;
    constructor(selectAble: ESelectOption, options: ICommonHeatMapOptions);
    rescale($node: d3.Selection<any>, dim: number[], scale: number[]): void;
    redraw($node: d3.Selection<any>, scale: number[]): void;
    recolor($node: d3.Selection<any>, data: IHeatMapAbleMatrix, color: IScale, scale: number[]): void;
    private genImage;
    private redrawImpl;
    build(data: IHeatMapAbleMatrix, $parent: d3.Selection<any>, scale: [number, number], c: IScale, onReady: () => void): d3.Selection<any>;
}
