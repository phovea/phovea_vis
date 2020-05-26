/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import * as d3 from 'd3';
import { Range } from 'phovea_core';
import { IMatrix } from 'phovea_core';
import { ESelectOption } from './IHeatMapRenderer';
import { ICommonHeatMapOptions } from './ICommonHeatMapOptions';
export declare abstract class AHeatMapCanvasRenderer {
    protected readonly selectAble: ESelectOption;
    protected options: ICommonHeatMapOptions;
    constructor(selectAble: ESelectOption, options: ICommonHeatMapOptions);
    rescale($node: d3.Selection<any>, dim: number[], scale: number[]): void;
    protected redrawSelection(canvas: HTMLCanvasElement, dim: number[], type: string, selected: Range[]): void;
    protected buildSelection(data: IMatrix<any, any>, $root: d3.Selection<any>, scale: [number, number]): void;
}
