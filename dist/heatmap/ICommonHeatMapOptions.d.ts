import { IVisInstanceOptions } from 'phovea_core';
export interface ICommonHeatMapOptions extends IVisInstanceOptions {
    /**
     * @default 10
     */
    initialScale?: number;
    /**
     * @default derived from value
     */
    color?: string[];
    /**
     * @default derived from value
     */
    domain?: (number | string)[];
    /**
     * missing value color
     * @default magenta
     */
    missingColor?: string;
    /**
     * defines the rendering mode, e.g. influencing how the selection is drawn
     */
    mode?: 'lg' | 'sm';
}
