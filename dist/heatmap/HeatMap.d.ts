/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import { Range } from 'tdp_core';
import { AVisInstance, IVisInstance } from 'tdp_core';
import { Rect } from 'tdp_core';
import { INumericalMatrix, ICategoricalMatrix } from 'tdp_core';
import { ICommonHeatMapOptions } from './ICommonHeatMapOptions';
import { IHeatMapRenderer, ESelectOption } from './IHeatMapRenderer';
import { IHeatMap1DOptions, IHeatMapAbleVector } from './HeatMap1D';
export declare type IHeatMapAbleMatrix = INumericalMatrix | ICategoricalMatrix;
export interface IHeatMapOptions extends ICommonHeatMapOptions {
    /**
     * @default null
     */
    scaleTo?: [number, number];
    /**
     * @default 200
     */
    duration?: number;
    /**
     * @default true
     */
    selectAble?: boolean;
    /**
     * force using images if possible
     * @default false
     */
    forceThumbnails?: boolean;
    /**
     * render optional labels,
     * @default NONE
     */
    labels?: ESelectOption;
}
export declare class HeatMap extends AVisInstance implements IVisInstance {
    data: IHeatMapAbleMatrix;
    parent: Element;
    private $node;
    private colorer;
    private renderer;
    private readonly options;
    constructor(data: IHeatMapAbleMatrix, parent: Element, options?: IHeatMapOptions);
    get rawSize(): [number, number];
    get node(): Element;
    option(name: string, val?: any): any;
    locateImpl(range: Range): Promise<Rect>;
    transform(scale?: [number, number], rotate?: number): {
        scale: [number, number];
        rotate: number;
    };
    private recolor;
    private build;
    private renderLabels;
    update(): void;
    static createRenderer(d: IHeatMapAbleMatrix, selectAble: ESelectOption, options: IHeatMapOptions): IHeatMapRenderer;
    static create2D(data: IHeatMapAbleMatrix, parent: HTMLElement, options?: IHeatMapOptions): HeatMap;
    static createHeatMapDimensions(data: IHeatMapAbleMatrix | IHeatMapAbleVector, parent: HTMLElement, options?: IHeatMapOptions | IHeatMap1DOptions): AVisInstance;
}
