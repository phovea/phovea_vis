/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import { ValueTypeUtils } from 'phovea_core';
export class DefaultUtils {
    static defaultColor(value) {
        if (value.type === ValueTypeUtils.VALUE_TYPE_CATEGORICAL) {
            return value.categories.map((c) => typeof c === 'string' ? 'gray' : c.color || 'gray');
        }
        const nv = value;
        const r = nv.range;
        if (r[0] < 0 && r[1] > 0) {
            //use a symmetric range
            return ['blue', 'white', 'red'];
        }
        return ['white', 'red'];
    }
    static defaultDomain(value) {
        if (value.type === ValueTypeUtils.VALUE_TYPE_CATEGORICAL) {
            return value.categories.map((c) => typeof c === 'string' ? c : c.name);
        }
        const nv = value;
        const r = nv.range;
        if (r[0] < 0 && r[1] > 0) {
            //use a symmetric range
            return [Math.min(r[0], -r[1]), 0, Math.max(-r[0], r[1])];
        }
        return r;
    }
    static isMissing(v) {
        return (v === null || (typeof v === 'number' && isNaN(v)));
    }
}
//# sourceMappingURL=DefaultUtils.js.map