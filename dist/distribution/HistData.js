/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import * as d3 from 'd3';
import { ValueTypeUtils } from 'tdp_core';
export class HistUtils {
    static createCategoricalHistData(hist) {
        const categories = hist.categories;
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
    static createNumericalHistData(hist, range) {
        const data = [], cols = d3.scale.linear().domain(range).range(['#111111', '#999999']), total = hist.validCount, binWidth = (range[1] - range[0]) / hist.bins;
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
    static createHistData(hist, data) {
        if (data.desc.type === 'stratification') {
            return HistUtils.createCategoricalHistData(hist);
        }
        const d = data.valuetype;
        if (d.type === ValueTypeUtils.VALUE_TYPE_CATEGORICAL) {
            return HistUtils.createCategoricalHistData(hist);
        }
        return HistUtils.createNumericalHistData(hist, d.range);
    }
    static resolveHistMax(hist, totalHeight) {
        const op = typeof totalHeight === 'function' ? totalHeight : () => totalHeight;
        return Promise.resolve(op(hist)).then((r) => {
            if (r === true) {
                return hist.validCount;
            }
            if (r === false) {
                return hist.largestBin;
            }
            return r;
        });
    }
}
//# sourceMappingURL=HistData.js.map