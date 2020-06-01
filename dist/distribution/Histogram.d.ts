/**
 * Created by Samuel Gratzl on 26.01.2016.
 */
import '../scss/main.scss';
import { Range } from 'phovea_core';
import { AVisInstance, IVisInstance, ITransform } from 'phovea_core';
import { IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc } from 'phovea_core';
import { IStratification } from 'phovea_core';
import { IDistributionOptions, ITotalHeight } from './HistData';
export interface IHistogramOptions extends IDistributionOptions {
    /**
     * options to specify how the total value is computed
     * @default true
     */
    total?: ITotalHeight;
    /**
     * @default Math.floor(Math.sqrt(data.length))
     */
    nbins?: number;
    /**
     * @default 200
     */
    duration?: number;
    /**
     * one color used for all the bins
     * @default the color of the bin that is provided by the histogram
     */
    color?: number;
}
export declare class Histogram extends AVisInstance implements IVisInstance {
    readonly data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification;
    private options;
    private readonly $node;
    private xscale;
    private yscale;
    private hist;
    private histData;
    constructor(data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification, parent: Element, options?: IHistogramOptions);
    get rawSize(): [number, number];
    get node(): SVGSVGElement;
    private build;
    locateImpl(range: Range): any;
    transform(scale?: [number, number], rotate?: number): ITransform;
    static createHistrogram(data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc>, parent: Element, options?: IHistogramOptions): Histogram;
}
