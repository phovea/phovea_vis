/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import * as d3 from 'd3';
import { IScale } from './IScale';
import { IHeatMapAbleMatrix } from './HeatMap';
export declare enum ESelectOption {
    CELL = 0,
    ROW = 1,
    COLUMN = 2,
    NONE = 3
}
export interface IHeatMapRenderer {
    rescale($node: d3.Selection<any>, dim: number[], scale: number[]): any;
    redraw($node: d3.Selection<any>, scale: number[]): any;
    recolor($node: d3.Selection<any>, data: IHeatMapAbleMatrix, color: IScale, scale: number[]): any;
    build(data: IHeatMapAbleMatrix, $parent: d3.Selection<any>, scale: [number, number], c: IScale, onReady: () => void): any;
}
