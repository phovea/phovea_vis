/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import '../scss/main.scss';
import { scale } from 'd3';
import { BaseUtils } from 'phovea_core';
import { AList } from './internal/AList';
export class BarPlot extends AList {
    constructor(data, parent, options = {}) {
        super(data, parent, BaseUtils.mixin({ cssClass: 'phovea-barplot', width: 100, min: NaN, max: NaN }, options));
        this.scale = scale.linear();
        this.build();
    }
    get maxBarWidth() {
        const scale = this.options.scale;
        return scale[0] * this.options.width;
    }
    get domain() {
        const r = this.data.valuetype.range;
        return [!isNaN(this.options.min) ? this.options.min : r[0], !isNaN(this.options.max) ? this.options.max : r[1]];
    }
    render($enter, $update) {
        this.scale.range([0, this.maxBarWidth]);
        const scale = this.options.scale;
        $update.attr('title', (d) => String(d));
        $update.style('width', (d) => this.scale(d) + 'px');
    }
    build() {
        this.scale.domain(this.domain).range([0, this.maxBarWidth]);
        return super.build();
    }
    static createBarPlot(data, parent, options) {
        return new BarPlot(data, parent, options);
    }
}
//# sourceMappingURL=barplot.js.map