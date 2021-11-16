/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import { Range } from 'tdp_core';
import { IVisInstanceOptions } from 'tdp_core';
import { IHistAbleDataType, INumberValueTypeDesc, ICategoricalValueTypeDesc } from 'tdp_core';
import { IStratification } from 'tdp_core';
import { ICatHistogram, IHistogram } from 'tdp_core';
export interface IHistData {
    readonly v: number;
    readonly acc: number;
    readonly ratio: number;
    readonly range: Range;
    readonly name: string;
    readonly color: string;
}
export declare class HistUtils {
    static createCategoricalHistData(hist: ICatHistogram): IHistData[];
    static createNumericalHistData(hist: IHistogram, range: number[]): IHistData[];
    static createHistData(hist: IHistogram, data: IHistAbleDataType<ICategoricalValueTypeDesc | INumberValueTypeDesc> | IStratification): IHistData[];
    static resolveHistMax(hist: IHistogram, totalHeight: ITotalHeight): Promise<number>;
}
export declare type ITotalHeight = number | boolean | ((hist: IHistogram) => number | boolean | Promise<number | boolean>);
export interface IDistributionOptions extends IVisInstanceOptions {
}
