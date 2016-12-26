/**
 * Created by Samuel Gratzl on 05.08.2014.
 */

import {AVisInstance} from 'phovea_core/src/vis';
import {IMatrix} from 'phovea_core/src/matrix';
import {IVector} from 'phovea_core/src/vector';
import {IHeatMapOptions, create as create2D} from './HeatMap';
import {IHeatMap1DOptions, create as create1D} from './HeatMap1D';

export {default as HeatMap} from './HeatMap';
export {default as HeatMap1D} from './HeatMap1D';

export function create(data: IMatrix|IVector, parent: HTMLElement, options?: IHeatMapOptions|IHeatMap1DOptions): AVisInstance {
  if (data.desc.type === 'matrix') {
    return create2D(<IMatrix>data, parent, <IHeatMapOptions>options);
  } else if (data.desc.type === 'vector') {
    return create1D(<IVector>data, parent, <IHeatMap1DOptions>options);
  }
  throw new Error('unknown data type: ' + data.desc.type);
}
