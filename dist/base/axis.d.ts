/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import { AVisInstance, IVisInstance, ITransform, IVisInstanceOptions } from 'phovea_core';
import { INumericalVector } from 'phovea_core';
import { Range } from 'phovea_core';
export interface IAxisOptions extends IVisInstanceOptions {
    /**
     * axis shift
     * @default 10
     */
    shift?: number;
    /**
     * axis orientation (left, right, top, bottom)
     * @default left
     */
    orient?: string;
    /**
     * @default 2
     */
    tickSize?: number;
    /**
     * radius
     * @default 2
     */
    r?: number;
}
export declare class Axis extends AVisInstance implements IVisInstance {
    readonly data: INumericalVector;
    private readonly options;
    private readonly $node;
    private $axis;
    private $points;
    private scale;
    private axis;
    constructor(data: INumericalVector, parent: HTMLElement, options?: IAxisOptions);
    get rawSize(): [number, number];
    get node(): HTMLElement;
    private build;
    locateImpl(range: Range): Promise<any>;
    transform(scale?: [number, number], rotate?: number): ITransform;
    private wrap;
    static createAxis(data: INumericalVector, parent: HTMLElement, options: IAxisOptions): Axis;
}
