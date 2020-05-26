/**
 * Created by Samuel Gratzl on 05.08.2014.
 */
import './style.scss';
import { AVisInstance, IVisInstance, IVisInstanceOptions } from 'phovea_core';
import { GraphProxy } from 'phovea_core';
export interface IForceDirectedGraphOptions extends IVisInstanceOptions {
    /**
     * assign colors
     * @default true
     */
    colors?: boolean;
}
export declare class ForceDirectedGraphVis extends AVisInstance implements IVisInstance {
    readonly data: GraphProxy;
    parent: Element;
    private readonly $node;
    private readonly options;
    constructor(data: GraphProxy, parent: Element, options?: IForceDirectedGraphOptions);
    /**
     * the raw size without any scaling factors applied
     * @returns {any[]}
     */
    get rawSize(): [number, number];
    /**
     * access to the HTML Element of this visualization
     * @returns {Element}
     */
    get node(): Element;
    /**
     * get/set an option of this vis
     * @param name
     * @param val
     * @returns {any}
     */
    option(name: string, val?: any): any;
    /**
     * transform this visualization given the scaling and rotation factor
     * @param scale a two number array
     * @param rotate a factor in degree
     * @returns {any}
     */
    transform(scale?: [number, number], rotate?: number): {
        scale: [number, number];
        rotate: number;
    };
    private build;
    static createForceDirectedGraphVis(data: GraphProxy, parent: Element, options?: IForceDirectedGraphOptions): ForceDirectedGraphVis;
}
