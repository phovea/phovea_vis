/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import '../style.scss';
import { format } from 'd3';
import { BaseUtils } from 'phovea_core';
import { AList } from './internal/AList';
export class List extends AList {
    constructor(data, parent, options = {}) {
        super(data, parent, BaseUtils.mixin({ format: null, rowHeight: 18 }, options));
        this.build();
    }
    render($enter, $update) {
        const formatter = this.options.format ? format(this.options.format) : String;
        const factor = this.options.scale[1];
        $update.style('font-size', (factor >= 1 ? null : Math.round(factor * 100) + '%'));
        $update.text(formatter);
    }
    static createList(data, parent, options) {
        return new List(data, parent, options);
    }
}
//# sourceMappingURL=list.js.map