/**
 * Created by Samuel Gratzl on 05.08.2014.
 */

import {AVisInstance} from 'phovea_core/src/vis';
import {IHeatMapOptions, create as create2D, IHeatMapAbleMatrix} from './HeatMap';
import {IHeatMap1DOptions, create as create1D, IHeatMapAbleVector} from './HeatMap1D';


export {default as HeatMap, IHeatMapAbleMatrix} from './HeatMap';
export {default as HeatMap1D, IHeatMapAbleVector} from './HeatMap1D';

export function create(data: IHeatMapAbleMatrix|IHeatMapAbleVector, parent: HTMLElement, options?: IHeatMapOptions|IHeatMap1DOptions): AVisInstance {
  if (data.desc.type === 'matrix') {
    return create2D(<IHeatMapAbleMatrix>data, parent, <IHeatMapOptions>options);
  } else if (data.desc.type === 'vector') {
    return create1D(<IHeatMapAbleVector>data, parent, <IHeatMap1DOptions>options);
  }
  throw new Error('unknown data type: ' + data.desc.type);
}
