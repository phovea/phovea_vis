/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
/// <reference types="d3" />
import { INumericalVector } from 'phovea_core';
import { AList, IAListOptions } from './internal/AList';
import { INumberValueTypeDesc } from 'phovea_core';
export interface IProportionalSymbolOptions extends IAListOptions {
    min?: number;
    max?: number;
}
export declare class ProportionalSymbol extends AList<number, INumberValueTypeDesc, IProportionalSymbolOptions> {
    private readonly scale;
    constructor(data: INumericalVector, parent: HTMLElement, options?: IProportionalSymbolOptions);
    private get maxDiameter();
    private get domain();
    protected render($enter: d3.Selection<number>, $update: d3.Selection<number>): void;
    protected build(): void;
    static createProportionalSymbol(data: INumericalVector, parent: HTMLElement, options: IProportionalSymbolOptions): ProportionalSymbol;
}
