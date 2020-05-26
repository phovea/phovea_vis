/**
 * Created by Samuel Gratzl on 26.12.2016.
 */

import * as d3 from 'd3';
import {Range} from 'phovea_core';
import {IVisInstanceOptions} from 'phovea_core';
import {
  VALUE_TYPE_CATEGORICAL,
  IHistAbleDataType, INumberValueTypeDesc, ICategoricalValueTypeDesc
} from 'phovea_core';
import {IStratification} from 'phovea_core';
import {ICatHistogram, IHistogram} from 'phovea_core';


export interface IHistData {
  readonly v: number;
  readonly acc: number;
  readonly ratio: number;
  readonly range: Range;
  readonly name: string;
  readonly color: string;
}

export class HistUtils {

  static createCategoricalHistData(hist: ICatHistogram): IHistData[] {
    const categories: any[] = hist.categories;
    const cols = hist.colors || d3.scale.category10().range();
    const total = hist.validCount;
    const data = [];
    let acc = 0;

    hist.forEach((b, i) => {
      data[i] = {
        v: b,
        acc,
        ratio: b / total,
        range: hist.range(i),

        name: (typeof categories[i] === 'string') ? categories[i] : categories[i].name,
        color: (categories[i].color === undefined) ? cols[i] : categories[i].color
      };
      acc += b;
    });
    return data;
  }

  static createNumericalHistData(hist: IHistogram, range: number[]): IHistData[] {
    const data = [],
      cols = d3.scale.linear<string, string>().domain(range).range(['#111111', '#999999']),
      total = hist.validCount,
      binWidth = (range[1] - range[0]) / hist.bins;
    let acc = 0;
    hist.forEach((b, i) => {
      data[i] = {
        v: b,
        acc,
        ratio: b / total,
        range: hist.range(i),

        name: 'Bin ' + (i + 1) + ' (center: ' + d3.round((i + 0.5) * binWidth, 2) + ')',
        color: cols((i + 0.5) * binWidth)
      };
      acc += b;
    });
    return data;
  }

  static createHistData(hist: IHistogram, data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification) {
    if (data.desc.type === 'stratification') {
      return HistUtils.createCategoricalHistData(<ICatHistogram>hist);
    }
    const d = (<IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>>data).valuetype;
    if (d.type === VALUE_TYPE_CATEGORICAL) {
      return HistUtils.createCategoricalHistData(<ICatHistogram>hist);
    }
    return HistUtils.createNumericalHistData(hist, (<INumberValueTypeDesc>d).range);
  }


  static resolveHistMax(hist: IHistogram, totalHeight: ITotalHeight): Promise<number> {
    const op: ((hist: IHistogram) => number|boolean) = typeof totalHeight === 'function' ? (<(hist: IHistogram) => number|boolean>totalHeight) : () => <number|boolean>totalHeight;
    return Promise.resolve<number|boolean>(op(hist)).then((r: number|boolean) => {
      if (r === true) {
        return hist.validCount;
      }
      if (r === false) {
        return hist.largestBin;
      }
      return <number>r;
    });
  }
}

export declare type ITotalHeight = number|boolean|((hist: IHistogram) => number|boolean|Promise<number|boolean>);

// tslint:disable-next-line:no-empty-interface
export interface IDistributionOptions extends IVisInstanceOptions {

}
