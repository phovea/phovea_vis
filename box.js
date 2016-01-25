/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
/// <amd-dependency path='css!./style' />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", '../caleydo_core/main', 'd3', '../caleydo_core/vis', '../caleydo_tooltip/main', "css!./style"], function (require, exports, C, d3, vis, tooltip) {
    /* global define */
    'use strict';
    var BoxPlot = (function (_super) {
        __extends(BoxPlot, _super);
        function BoxPlot(data, parent, options) {
            if (options === void 0) { options = {}; }
            this.data = data;
            this.options = {};
            C.mixin(this.options, options);
            this.$node = this.build(d3.select(parent));
            this.$node.datum(this);
        }
        Object.defineProperty(BoxPlot.prototype, "rawSize", {
            get: function () {
                return [300, 50];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoxPlot.prototype, "node", {
            get: function () {
                return this.$node.node();
            },
            enumerable: true,
            configurable: true
        });
        BoxPlot.prototype.build = function ($parent) {
            var _this = this;
            var size = this.size, data = this.data;
            var $svg = $parent.append('svg').attr({
                width: size[0],
                height: size[1],
                'class': 'box'
            });
            var $t = $svg.append('g');
            var s = this.scale = d3.scale.linear().domain(this.data.desc.value.range).range([0, size[0]]).clamp(true);
            $t.append('path').attr({
                d: 'M0,0 L0,$ M0,§ L%,§ M%,0 L%,$'.replace(/%/g, size[0]).replace(/\$/g, size[1]).replace(/\§/g, size[1] / 2),
                'class': 'axis'
            });
            data.stats().then(function (stats) {
                var text = createText(stats);
                $t.append('rect').attr({
                    x: s(stats.mean - stats.sd),
                    y: '10%',
                    width: s(stats.sd * 2),
                    height: '80%',
                    'class': 'box'
                }).call(tooltip.bind(text));
                $t.append('line').attr({
                    x1: s(stats.mean),
                    x2: s(stats.mean),
                    y1: '10%',
                    y2: '90%',
                    'class': 'mean'
                });
                _this.markReady();
            });
            return $svg;
        };
        BoxPlot.prototype.locateImpl = function (range) {
            var that = this;
            if (range.isAll || range.isNone) {
                var r = this.scale.range();
                return { x: r[0], w: r[1] - r[0], y: 0, h: 50 };
            }
            return this.data.data(range).then(function (data) {
                var ex = d3.extent(data, that.scale);
                return { x: ex[0], w: ex[1] - ex[0], y: 0, h: 50 };
            });
        };
        return BoxPlot;
    })(vis.AVisInstance);
    exports.BoxPlot = BoxPlot;
    function create(data, parent, options) {
        return new BoxPlot(data, parent, options);
    }
    exports.create = create;
});
//# sourceMappingURL=box.js.map