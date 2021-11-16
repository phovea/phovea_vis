/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import { Range } from 'tdp_core';
import { AVisInstance, IVisInstance } from 'tdp_core';
import { Rect } from 'tdp_core';
import { INumericalVector, ICategoricalVector } from 'tdp_core';
import { ICommonHeatMapOptions } from './ICommonHeatMapOptions';
export interface IHeatMap1DOptions extends ICommonHeatMapOptions {
    /**
     * width
     * @default 20
     */
    width?: number;
    /**
     * scale such that the height matches the argument
     * @default null
     */
    heightTo?: number;
}
export declare type IHeatMapAbleVector = INumericalVector | ICategoricalVector;
export declare class HeatMap1D extends AVisInstance implements IVisInstance {
    readonly data: IHeatMapAbleVector;
    parent: Element;
    private readonly $node;
    private readonly colorer;
    private readonly options;
    constructor(data: IHeatMapAbleVector, parent: Element, options?: IHeatMap1DOptions);
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
    static create1D(data: IHeatMapAbleVector, parent: HTMLElement, options?: IHeatMap1DOptions): AVisInstance;
}
