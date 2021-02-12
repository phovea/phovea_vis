/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import { Range } from 'phovea_core';
import { AVisInstance, IVisInstance, IVisInstanceOptions } from 'phovea_core';
import { Rect } from 'phovea_core';
import { INumericalVector } from 'phovea_core';
export declare type IBoxPlotOptions = IVisInstanceOptions;
export declare class BoxPlot extends AVisInstance implements IVisInstance {
    data: INumericalVector;
    private readonly options;
    private readonly $node;
    private scale;
    constructor(data: INumericalVector, parent: Element, options?: IBoxPlotOptions);
    get rawSize(): [number, number];
    get node(): Element;
    private build;
    locateImpl(range: Range): Promise<Rect>;
    static createBoxPlot(data: INumericalVector, parent: Element, options?: IBoxPlotOptions): BoxPlot;
}
