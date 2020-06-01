/**
 * Created by Samuel Gratzl on 26.01.2016.
 */
import '../scss/main.scss';
import { Range } from 'phovea_core';
import { AVisInstance, IVisInstance, ITransform } from 'phovea_core';
import { IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc } from 'phovea_core';
import { IStratification } from 'phovea_core';
import { Polygon } from 'phovea_core';
import { IDistributionOptions, ITotalHeight } from './HistData';
export interface IPieOptions extends IDistributionOptions {
    /**
     * options to specify how the total value is computed
     * @default true
     */
    total?: ITotalHeight;
    /**
     * @default 200
     */
    duration?: number;
    /**
     * @default 50
     */
    radius?: number;
    /**
     * @default 0
     */
    innerRadius?: number;
}
export declare class Pie extends AVisInstance implements IVisInstance {
    readonly data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification;
    private readonly options;
    private readonly $node;
    private scale;
    private arc;
    private hist;
    private histData;
    constructor(data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification, parent: Element, options?: IPieOptions);
    get rawSize(): [number, number];
    get node(): Element;
    private build;
    locateImpl(range: Range): any;
    transform(scale?: [number, number], rotate?: number): ITransform;
    static createPie(data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification, parent: Element, options?: IPieOptions): Pie;
    static toPolygon(start: number, end: number, radius: number): Polygon;
}
