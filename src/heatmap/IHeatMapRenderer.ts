/**
 * Created by Samuel Gratzl on 26.12.2016.
 */

import * as d3 from 'd3';
import {IMatrix} from 'phovea_core/src/matrix';
import {IScale} from './utils';

export enum ESelectOption {
  CELL,
  ROW,
  COLUMN,
  NONE
}

export interface IHeatMapRenderer {
  rescale($node: d3.Selection<any>, dim: number[], scale: number[]);
  redraw($node: d3.Selection<any>, scale: number[]);
  recolor($node: d3.Selection<any>, data: IMatrix, color: IScale, scale: number[]);
  build(data: IMatrix, $parent: d3.Selection<any>, scale: [number, number], c: IScale, onReady: () => void);
}
