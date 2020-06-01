/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import '../scss/main.scss';
import { scale } from 'd3';
import { BaseUtils } from 'phovea_core';
import { AList } from './internal/AList';
export class ProportionalSymbol extends AList {
    constructor(data, parent, options = {}) {
        super(data, parent, BaseUtils.mixin({ cssClass: 'phovea-proportional-symbol', width: 20, min: NaN, max: NaN }, options));
        this.scale = scale.linear();
        this.build();
    }
    get maxDiameter() {
        const scale = this.options.scale;
        const w = scale[0] * this.options.width;
        const h = scale[1] * this.options.rowHeight;
        return Math.min(w, h);
    }
    get domain() {
        const r = this.data.valuetype.range;
        return [!isNaN(this.options.min) ? this.options.min : r[0], !isNaN(this.options.max) ? this.options.max : r[1]];
    }
    render($enter, $update) {
        this.scale.range([0, this.maxDiameter]);
        $update.attr('title', (d) => String(d));
        $update.style('width', (d) => this.scale(d) + 'px');
        $update.style('height', (d) => this.scale(d) + 'px');
    }
    build() {
        this.scale.domain(this.domain).range([0, this.maxDiameter]);
        return super.build();
    }
    static createProportionalSymbol(data, parent, options) {
        return new ProportionalSymbol(data, parent, options);
    }
}
//# sourceMappingURL=proportionalSymbol.js.map