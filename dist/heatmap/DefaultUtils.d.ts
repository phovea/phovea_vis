/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import { INumberValueTypeDesc, ICategoricalValueTypeDesc } from 'phovea_core';
export declare class DefaultUtils {
    static defaultColor(value: INumberValueTypeDesc | ICategoricalValueTypeDesc): string[];
    static defaultDomain(value: INumberValueTypeDesc | ICategoricalValueTypeDesc): (string | number)[];
    static isMissing(v: any): boolean;
}
