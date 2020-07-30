export interface IScale {
    (x: any): any;
    domain(): any[];
    domain(values: any[]): IScale;
    range(): any[];
    range(values: any[]): IScale;
}
export declare class ScaleUtils {
    static toScale(value: any): IScale;
}
