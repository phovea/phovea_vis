/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
/// <amd-dependency path='css!./style' />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", '../caleydo_core/main', 'd3', '../caleydo_core/vis', '../caleydo_core/idtype', '../caleydo_core/geom', "css!./style"], function (require, exports, C, d3, vis, idtypes, geom) {
    /* global define */
    'use strict';
    var BarPlot = (function (_super) {
        __extends(BarPlot, _super);
        function BarPlot(data, parent, options) {
            if (options === void 0) { options = {}; }
            this.data = data;
            this.options = {
                cssClass: '',
                width: 100,
                heighti: 10,
                min: 0,
                max: NaN
            };
            C.mixin(this.options, options);
            this.$node = this.build(d3.select(parent));
            this.$node.datum(this);
        }
        Object.defineProperty(BarPlot.prototype, "rawSize", {
            get: function () {
                return [this.options.width, data.dim[0] * this.options.heighti];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BarPlot.prototype, "node", {
            get: function () {
                return this.$node.node();
            },
            enumerable: true,
            configurable: true
        });
        BarPlot.prototype.build = function ($parent) {
            var _this = this;
            var o = this.options;
            var $svg = $parent.append('svg').attr({
                width: size[0],
                height: size[1],
                'class': 'barplot ' + o.cssClass
            });
            //using range bands with an ordinal scale for uniform distribution
            var xscale = this.xscale = d3.scale.linear().range([0, 100]);
            var yscale = this.yscale = d3.scale.linear().range([0, 100]);
            var onClick = function (d, i) {
                data.select(0, [i], idtypes.toSelectOperation(d3.event));
            };
            var l = function (event, type, selected) {
                $svg.selectAll('rect').classed('select-' + type, false);
                if (selected.isNone) {
                    return;
                }
                var dim0 = selected.dim(0);
                if (selected.isAll) {
                    $svg.selectAll('rect').classed('select-' + type, true);
                }
                else {
                    dim0.forEach(function (j) { return $svg.selectAll('rect:nth-child(' + (j + 1) + ')').classed('select-' + type, true); });
                }
            };
            data.on('select', l);
            C.onDOMNodeRemoved($svg.node(), function () { return data.off('select', l); });
            data.data().then(function (_data) {
                yscale.domain([0, data.length]);
                if (isNaN(o.min) || isNaN(o.max)) {
                    var minmax = d3.extent(_data);
                    if (isNaN(o.min)) {
                        o.min = minmax[0];
                    }
                    if (isNaN(o.max)) {
                        o.max = minmax[1];
                    }
                }
                xscale.domain([o.min, o.max]);
                var $m = $svg.selectAll('rect').data(_data);
                $m.enter().append('rect')
                    .on('click', onClick);
                $m.attr({
                    y: function (d, i) { return yscale(i); },
                    height: function (d) { return yscale(1); },
                    width: xscale
                });
                _this.markReady();
                data.selections().then(function (selected) { return l(null, 'selected', selected); });
            });
            return $svg;
        };
        BarPlot.prototype.locateImpl = function (range) {
            var ex_i = d3.extent(range.dim(0).iter().asList());
            return this.data.data(range).then(function (data) {
                var ex_v = d3.extent(data);
                return geom.rect(that.xscale(ex_v[0]) / 100.0 * o.width, ex_i[0] * o.heighti, that.xscale(ex_v[1]) / 100.0 * o.width, (ex_i[1] + 1) * o.heighti);
            });
        };
        return BarPlot;
    })(vis.AVisInstance);
    exports.BarPlot = BarPlot;
    function create(data, parent, options) {
        return new BarPlot(data, parent, options);
    }
    exports.create = create;
});
//# sourceMappingURL=barplot.js.map