/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
/// <reference types="d3" />
import '../scss/main.scss';
import { AVisInstance, IVisInstance, IVisInstanceOptions } from 'phovea_core';
import { IVector } from 'phovea_core';
import { Rect } from 'phovea_core';
import { Range } from 'phovea_core';
import { IValueTypeDesc } from 'phovea_core';
export interface IAListOptions extends IVisInstanceOptions {
    width?: number;
    rowHeight?: number;
    cssClass?: string;
}
export declare abstract class AList<T, D extends IValueTypeDesc, O extends IAListOptions> extends AVisInstance implements IVisInstance {
    readonly data: IVector<T, D>;
    private readonly parent;
    protected readonly options: O;
    private readonly $node;
    constructor(data: IVector<T, D>, parent: HTMLElement, options: O);
    get rawSize(): [number, number];
    get node(): HTMLElement;
    locateImpl(range: Range): Promise<Rect>;
    transform(scale?: [number, number], rotate?: number): {
        scale: [number, number];
        rotate: number;
    };
    protected abstract render($enter: d3.Selection<T>, $update: d3.Selection<T>): any;
    update(): void;
    protected build(): void;
}
