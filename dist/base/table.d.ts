/**
 * Created by Samuel Gratzl on 05.08.2014.
 */
import { Range } from 'phovea_core';
import { AVisInstance, IVisInstance, IVisInstanceOptions } from 'phovea_core';
import { Rect } from 'phovea_core';
import { IAnyMatrix } from 'phovea_core';
import { ITable } from 'phovea_core';
import { IAnyVector } from 'phovea_core';
export declare type ITableOptions = IVisInstanceOptions;
export declare class Table extends AVisInstance implements IVisInstance {
    readonly data: IAnyMatrix | ITable | IAnyVector;
    private readonly $node;
    private readonly options;
    constructor(data: IAnyMatrix | ITable | IAnyVector, parent: Element, options?: ITableOptions);
    get rawSize(): [number, number];
    get node(): Element;
    locateImpl(range: Range): Promise<Rect>;
    transform(scale?: [number, number], rotate?: number): {
        scale: [number, number];
        rotate: number;
    };
    private build;
    static createTable(data: IAnyMatrix | ITable | IAnyVector, parent: Element, options?: ITableOptions): Table;
}
