/**
 * Created by Samuel Gratzl on 01.10.2015.
 */
import { Range } from 'phovea_core';
import { AVisInstance, IVisInstance, IVisInstanceOptions } from 'phovea_core';
import { INumericalVector } from 'phovea_core';
export interface IKaplanMaierOptions extends IVisInstanceOptions {
    /**
     * @default 300
     */
    width?: number;
    /**
     * @default 300
     */
    height?: number;
    /**
     * maxtime in total given
     * @param died the current one
     * @default last one
     */
    maxTime?(died: number[]): number | Promise<number>;
}
export declare class KaplanMeierPlot extends AVisInstance implements IVisInstance {
    readonly data: INumericalVector;
    parent: Element;
    private readonly $node;
    private readonly options;
    private readonly line;
    constructor(data: INumericalVector, parent: Element, options?: IKaplanMaierOptions);
    get rawSize(): [number, number];
    get node(): Element;
    locateImpl(range: Range): Promise<any>;
    transform(scale?: [number, number], rotate?: number): {
        scale: [number, number];
        rotate: number;
    };
    private build;
    static createKaplanMeierPlot(data: INumericalVector, parent: Element, options?: IKaplanMaierOptions): KaplanMeierPlot;
}
