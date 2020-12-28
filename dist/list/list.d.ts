/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
/// <reference types="d3" />
import { IAnyVector } from 'phovea_core';
import { AList, IAListOptions } from './internal/AList';
import { IValueTypeDesc } from 'phovea_core';
export interface IListOptions extends IAListOptions {
    format?: string;
}
export declare class List extends AList<any, IValueTypeDesc, IListOptions> {
    constructor(data: IAnyVector, parent: HTMLElement, options?: IListOptions);
    protected render($enter: d3.Selection<any>, $update: d3.Selection<any>): void;
    static createList(data: IAnyVector, parent: HTMLElement, options: IListOptions): List;
}
