/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
/// <reference types="d3" />
import '../scss/main.scss';
import { INumericalVector } from 'phovea_core';
import { AList, IAListOptions } from './internal/AList';
import { INumberValueTypeDesc } from 'phovea_core';
export interface IBarPlotOptions extends IAListOptions {
    min?: number;
    max?: number;
}
export declare class BarPlot extends AList<number, INumberValueTypeDesc, IBarPlotOptions> {
    private readonly scale;
    constructor(data: INumericalVector, parent: HTMLElement, options?: IBarPlotOptions);
    private get maxBarWidth();
    private get domain();
    protected render($enter: d3.Selection<number>, $update: d3.Selection<number>): void;
    protected build(): void;
    static createBarPlot(data: INumericalVector, parent: HTMLElement, options: IBarPlotOptions): BarPlot;
}
