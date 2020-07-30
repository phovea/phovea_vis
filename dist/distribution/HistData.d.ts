/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import { Range } from 'phovea_core';
import { IVisInstanceOptions } from 'phovea_core';
import { IHistAbleDataType, INumberValueTypeDesc, ICategoricalValueTypeDesc } from 'phovea_core';
import { IStratification } from 'phovea_core';
import { ICatHistogram, IHistogram } from 'phovea_core';
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
