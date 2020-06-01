/**
 * Created by Samuel Gratzl on 26.01.2016.
 */
import '../scss/main.scss';
import { Range } from 'phovea_core';
import { AVisInstance, IVisInstance, ITransform } from 'phovea_core';
import { IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc } from 'phovea_core';
import { IStratification } from 'phovea_core';
import { IDistributionOptions } from './HistData';
export interface IMosaicOptions extends IDistributionOptions {
    /**
     * @default 20
     */
    width?: number;
    /**
     * @default 200
     */
    duration?: number;
    /**
     * target height such that the mosaic will fit
     * @default null
     */
    heightTo?: number;
    /**
     * @default 10
     */
    initialScale?: number;
    /**
     * @default true
     */
    selectAble?: boolean;
}
export declare class Mosaic extends AVisInstance implements IVisInstance {
    readonly data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification;
    private readonly options;
    private readonly $node;
    private hist;
    private histData;
    constructor(data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification, parent: Element, options?: IMosaicOptions);
    get rawSize(): [number, number];
    get node(): Element;
    private build;
    locateImpl(range: Range): any;
    transform(scale?: [number, number], rotate?: number): ITransform;
    static createMosaic(data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification, parent: Element, options?: IMosaicOptions): Mosaic;
}
