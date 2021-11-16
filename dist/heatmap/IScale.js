import * as d3 from 'd3';
import { ValueTypeUtils } from 'tdp_core';
export class ScaleUtils {
    static toScale(value) {
        if (value.type === ValueTypeUtils.VALUE_TYPE_CATEGORICAL) {
            return d3.scale.ordinal();
        }
        return d3.scale.linear();
    }
}
//# sourceMappingURL=IScale.js.map