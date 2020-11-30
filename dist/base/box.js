/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import * as d3 from 'd3';
import { AVisInstance, VisUtils } from 'phovea_core';
import { Rect } from 'phovea_core';
import { BaseUtils } from 'phovea_core';
import { ToolTip } from 'phovea_d3';
function createText(stats) {
    let r = '<table><tbody>';
    const keys = ['min', 'max', 'sum', 'mean', 'median', 'q1', 'q3', 'var', 'sd', 'n', 'nans', 'moment2', 'moment3', 'moment4', 'kurtosis', 'skewness'];
    keys.forEach(function (key) {
        const value = stats[key];
        r = `${r}<tr><td>${key}</td><td>${value}</td></tr>`;
    });
    r = `${r}</tbody></table>`;
    return r;
}
export class BoxPlot extends AVisInstance {
    constructor(data, parent, options = {}) {
        super();
        this.data = data;
        this.options = {
            scale: [1, 1],
            rotate: 0
        };
        BaseUtils.mixin(this.options, options);
        this.$node = this.build(d3.select(parent));
        this.$node.datum(this);
        VisUtils.assignVis(this.node, this);
    }
    get rawSize() {
        return [300, 50];
    }
    get node() {
        return this.$node.node();
    }
    build($parent) {
        const size = this.size, data = this.data;
        const $svg = $parent.append('svg').attr({
            width: size[0],
            height: size[1],
            'class': 'phovea-box'
        });
        const $t = $svg.append('g');
        const s = this.scale = d3.scale.linear().domain(this.data.desc.value.range).range([0, size[0]]).clamp(true);
        $t.append('path').attr({
            d: `M0,0 L0,${size[1]} M0,${size[1] / 2} L${size[0]},${size[1] / 2} M${size[0]},0 L${size[0]},${size[1]}`,
            'class': 'axis'
        });
        data.statsAdvanced().then((stats) => {
            const text = createText(stats);
            $t.append('rect').attr({
                x: s(stats.q1),
                y: '10%',
                width: s(stats.q3),
                height: '80%',
                'class': 'box'
            }).call(ToolTip.bind(text));
            $t.append('line').attr({
                x1: s(stats.median),
                x2: s(stats.median),
                y1: '10%',
                y2: '90%',
                'class': 'mean'
            });
            this.markReady();
        });
        return $svg;
    }
    locateImpl(range) {
        const that = this;
        if (range.isAll || range.isNone) {
            const r = this.scale.range();
            return Promise.resolve(Rect.rect(r[0], 0, r[1] - r[0], 50));
        }
        return this.data.data(range).then(function (data) {
            const ex = d3.extent(data, that.scale);
            return Rect.rect(ex[0], 0, ex[1] - ex[0], 50);
        });
    }
    static createBoxPlot(data, parent, options) {
        return new BoxPlot(data, parent, options);
    }
}
//# sourceMappingURL=box.js.map