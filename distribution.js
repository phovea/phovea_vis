/**
 * Created by Samuel Gratzl on 26.01.2016.
 */
/// <amd-dependency path='css!./style' />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", '../caleydo_core/main', 'd3', '../caleydo_core/vis', '../caleydo_core/idtype', '../caleydo_core/geom', '../caleydo_tooltip/main', "css!./style"], function (require, exports, C, d3, vis, idtypes, geom, tooltip) {
    /* global define */
    'use strict';
    function createCategoricalHistData(hist) {
        var categories = hist.categories, cols = hist.colors || d3.scale.category10().range(), total = hist.validCount;
        var data = [], acc = 0;
        hist.forEach(function (b, i) {
            data[i] = {
                v: b,
                acc: acc,
                ratio: b / total,
                range: hist.range(i),
                name: (typeof categories[i] === 'string') ? categories[i] : categories[i].name,
                color: (categories[i].color === undefined) ? cols[i] : categories[i].color
            };
            acc += b;
        });
        return data;
    }
    function createNumericalHistData(hist, range) {
        var data = [], cols = d3.scale.linear().domain(range).range(['#111111', '#999999']), total = hist.validCount, binWidth = (range[1] - range[0]) / hist.bins, acc = 0;
        hist.forEach(function (b, i) {
            data[i] = {
                v: b,
                acc: acc,
                ratio: b / total,
                range: hist.range(i),
                name: 'Bin ' + (i + 1) + ' (center: ' + d3.round((i + 0.5) * binWidth, 2) + ')',
                color: cols((i + 0.5) * binWidth)
            };
            acc += b;
        });
        return data;
    }
    function createHistData(hist, desc, data) {
        if (desc.type === 'stratification') {
            return createCategoricalHistData(hist);
        }
        if (data.valuetype.type === 'categorical') {
            return createCategoricalHistData(hist);
        }
        return createNumericalHistData(hist, data.valuetype.range);
    }
    function resolveHistMax(hist, totalHeight) {
        var op = d3.functor(totalHeight);
        return Promise.resolve(op(hist)).then(function (r) {
            if (r === true) {
                return hist.validCount;
            }
            if (r === false) {
                return hist.largestBin;
            }
            return r;
        });
    }
    var Histogram = (function (_super) {
        __extends(Histogram, _super);
        function Histogram(data, parent, options) {
            if (options === void 0) { options = {}; }
            _super.call(this);
            this.data = data;
            this.options = {
                nbins: 5,
                total: true,
                duration: 200,
                scale: [1, 1],
                rotate: 0
            };
            C.mixin(this.options, {
                nbins: Math.floor(Math.sqrt(data.length)),
            }, options);
            this.$node = this.build(d3.select(parent));
            this.$node.datum(this);
        }
        Object.defineProperty(Histogram.prototype, "rawSize", {
            get: function () {
                return [200, 100];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Histogram.prototype, "node", {
            get: function () {
                return this.$node.node();
            },
            enumerable: true,
            configurable: true
        });
        Histogram.prototype.build = function ($parent) {
            var _this = this;
            var size = this.size, data = this.data, o = this.options;
            var $svg = $parent.append('svg').attr({
                width: size[0],
                height: size[1],
                'class': 'histogram'
            });
            var $t = $svg.append('g');
            var $data = $t.append('g');
            var $highlight = $t.append('g').style('pointer-events', 'none').classed('select-selected', true);
            //using range bands with an ordinal scale for uniform distribution
            var xscale = this.xscale = d3.scale.ordinal().rangeBands([0, size[0]], 0.1);
            var yscale = this.yscale = d3.scale.linear().range([0, size[1]]);
            var l = function (event, type, selected) {
                if (!_this.hist_data) {
                    return;
                }
                var highlights = _this.hist_data.map(function (entry, i) {
                    var s = entry.range.intersect(selected);
                    return {
                        i: i,
                        v: s.size()[0]
                    };
                }).filter(function (entry) { return entry.v > 0; });
                var $m = $highlight.selectAll('rect').data(highlights);
                $m.enter().append('rect').attr('width', xscale.rangeBand());
                $m.attr({
                    x: function (d) {
                        return xscale(d.i);
                    },
                    y: function (d) {
                        return yscale(yscale.domain()[1] - d.v);
                    },
                    height: 0
                });
                $m.transition().duration(o.duration).attr('height', function (d) {
                    return yscale(d.v);
                });
                $m.exit().remove();
            };
            data.on('select', l);
            C.onDOMNodeRemoved($data.node(), function () {
                data.off('select', l);
            });
            var onClick = function (d) { return data.select(0, d.range, idtypes.toSelectOperation(d3.event)); };
            this.data.hist(Math.floor(o.nbins)).then(function (hist) {
                _this.hist = hist;
                xscale.domain(d3.range(hist.bins));
                return resolveHistMax(hist, _this.options.total);
            }).then(function (hist_max) {
                var hist = _this.hist;
                yscale.domain([0, hist_max]);
                var hist_data = _this.hist_data = createHistData(hist, _this.data.desc, _this.data);
                var $m = $data.selectAll('rect').data(hist_data);
                $m.enter().append('rect')
                    .attr('width', xscale.rangeBand())
                    .call(tooltip.bind(function (d) {
                    return d.name + ' ' + (d.v) + ' entries (' + Math.round(d.ratio * 100) + '%)';
                }))
                    .on('click', onClick);
                $m.attr({
                    x: function (d, i) { return xscale(i); },
                    fill: function (d) { return d.color; },
                    y: function (d) { return yscale(yscale.domain()[1] - d.v); },
                    height: function (d) { return yscale(d.v); }
                });
                _this.markReady();
                data.selections().then(function (selected) {
                    l(null, 'selected', selected);
                });
            });
            return $svg;
        };
        Histogram.prototype.locateImpl = function (range) {
            var that = this, size = this.rawSize;
            if (range.isAll || range.isNone) {
                return Promise.resolve({ x: 0, y: 0, w: size[0], h: size[1] });
            }
            return this.data.data(range).then(function (data) {
                var ex = d3.extent(data, function (value) {
                    return that.hist.binOf(value);
                });
                var h0 = that.hist_data[ex[0]];
                var h1 = that.hist_data[ex[1]];
                return Promise.resolve({
                    x: that.xscale(ex[0]),
                    width: (that.xscale(ex[1]) - that.xscale(ex[0]) + that.xscale.rangeBand()),
                    height: that.yscale(Math.max(h0.v, h1.v)),
                    y: that.yscale(that.yscale.domain()[1] - Math.max(h0.v, h1.v))
                });
            });
        };
        return Histogram;
    })(vis.AVisInstance);
    exports.Histogram = Histogram;
    var Mosaic = (function (_super) {
        __extends(Mosaic, _super);
        function Mosaic(data, parent, options) {
            if (options === void 0) { options = {}; }
            _super.call(this);
            this.data = data;
            this.options = {
                width: 20,
                initialScale: 10,
                duration: 200,
                heightTo: null,
                selectAble: true,
                scale: [1, 1],
                rotate: 0
            };
            C.mixin(this.options, {
                scale: [1, this.options.initialScale]
            }, options);
            if (this.options.heightTo) {
                this.options.scale[1] = this.options.heightTo / this.data.dim[0];
            }
            this.$node = this.build(d3.select(parent));
            this.$node.datum(this);
        }
        Object.defineProperty(Mosaic.prototype, "rawSize", {
            get: function () {
                return [this.options.width, this.data.dim[0]];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mosaic.prototype, "node", {
            get: function () {
                return this.$node.node();
            },
            enumerable: true,
            configurable: true
        });
        Mosaic.prototype.build = function ($parent) {
            var _this = this;
            var size = this.size, data = this.data, o = this.options;
            var $svg = $parent.append('svg').attr({
                width: size[0],
                height: size[1],
                'class': 'mosaic'
            });
            var $scale = $svg.append('g').attr('transform', 'scale(' + o.scale[0] + ',' + o.scale[1] + ')');
            var $data = $scale.append('g');
            var $highlight = $scale.append('g').style('pointer-events', 'none').classed('select-selected', true);
            var l = function (event, type, selected) {
                if (!_this.hist_data) {
                    return;
                }
                var highlights = _this.hist_data.map(function (entry, i) {
                    var s = entry.range.intersect(selected);
                    return {
                        i: i,
                        acc: entry.acc,
                        v: s.size()[0]
                    };
                }).filter(function (entry) { return entry.v > 0; });
                var $m = $highlight.selectAll('rect').data(highlights);
                $m.enter().append('rect').attr('width', '100%').classed('select-selected', true);
                $m.attr({
                    y: function (d) { return d.acc; },
                    height: function (d) { return d.v; }
                }).style('opacity', 0);
                $m.transition().duration(o.duration).style('opacity', 1);
                $m.exit().remove();
            };
            if (o.selectAble) {
                data.on('select', l);
                C.onDOMNodeRemoved($data.node(), function () {
                    data.off('select', l);
                });
            }
            var onClick = o.selectAble ? function (d) {
                data.select(0, d.range, idtypes.toSelectOperation(d3.event));
            } : null;
            this.data.hist().then(function (hist) {
                this.hist = hist;
                var hist_data = this.hist_data = createHistData(hist, data.desc, data);
                var $m = $data.selectAll('rect').data(hist_data);
                $m.enter().append('rect')
                    .attr('width', '100%')
                    .call(tooltip.bind(function (d) {
                    return d.name + ' ' + (d.v) + ' entries (' + Math.round(d.ratio * 100) + '%)';
                }))
                    .on('click', onClick);
                $m.attr({
                    y: function (d) { return d.acc; },
                    height: function (d) { return d.v; },
                    fill: function (d) { return d.color; }
                });
                this.fire('built');
                this.markReady();
                if (o.selectAble) {
                    data.selections().then(function (selected) {
                        l(null, 'selected', selected);
                    });
                }
            });
            return $svg;
        };
        Mosaic.prototype.locateImpl = function (range) {
            var that = this;
            if (range.isAll || range.isNone) {
                return Promise.resolve({ x: 0, y: 0, w: this.rawSize[0], h: this.data.length });
            }
            return this.data.data(range).then(function (data) {
                var ex = d3.extent(data, function (value) {
                    return that.hist.binOf(value);
                });
                var h0 = that.hist_data[ex[0]];
                var h1 = that.hist_data[ex[1]];
                var y = Math.min(h0.acc, h1.acc);
                var y2 = Math.max(h0.acc + h0.v, h1.acc + h1.v);
                return Promise.resolve({
                    x: 0,
                    width: that.rawSize[0],
                    height: y2 - y,
                    y: y
                });
            });
        };
        return Mosaic;
    })(vis.AVisInstance);
    exports.Mosaic = Mosaic;
    function toPolygon(start, end, radius) {
        var r = [
            geom.vec2(radius, radius),
            geom.vec2(radius + Math.cos(start) * radius, radius + Math.sin(start) * radius),
            geom.vec2(radius + Math.cos(end) * radius, radius + Math.sin(end) * radius)
        ];
        //approximate by triangle
        if (end - start > Math.PI) {
            r.splice(2, 0, geom.vec2(radius + Math.cos((end - start) * 0.5) * radius, radius + Math.sin((end - start) * 0.5) * radius));
        }
        return geom.polygon(r);
    }
    var Pie = (function (_super) {
        __extends(Pie, _super);
        function Pie(data, parent, options) {
            if (options === void 0) { options = {}; }
            _super.call(this);
            this.data = data;
            this.options = {
                radius: 50,
                innerRadius: 0,
                duration: 200,
                total: true,
                scale: [1, 1],
                rotate: 0
            };
            C.mixin(this.options, options);
            this.$node = this.build(d3.select(parent));
            this.$node.datum(this);
        }
        Object.defineProperty(Pie.prototype, "rawSize", {
            get: function () {
                var r = this.options.radius;
                return [r * 2, r * 2];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pie.prototype, "node", {
            get: function () {
                return this.$node.node();
            },
            enumerable: true,
            configurable: true
        });
        Pie.prototype.build = function ($parent) {
            var _this = this;
            var size = this.size, data = this.data, o = this.options;
            var $svg = $parent.append('svg').attr({
                width: size[0],
                height: size[1],
                'class': 'pie'
            });
            var $base = $svg.append('g').attr('transform', 'translate(' + o.radius + ',' + o.radius + ')');
            var $data = $base.append('g');
            var $highlight = $base.append('g').style('pointer-events', 'none').classed('select-selected', true);
            var scale = this.scale = d3.scale.linear().range([0, 2 * Math.PI]);
            var arc = this.arc = d3.svg.arc().innerRadius(o.innerRadius).outerRadius(o.radius)
                .startAngle(function (d) { return scale(d.start); })
                .endAngle(function (d) { return scale(d.end); });
            var l = function (event, type, selected) {
                if (!_this.hist_data) {
                    return;
                }
                var highlights = _this.hist_data.map(function (entry) {
                    var s = entry.range.intersect(selected);
                    return {
                        start: entry.start,
                        end: entry.start + s.size()[0]
                    };
                }).filter(function (entry) { return entry.start < entry.end; });
                var $m = $highlight.selectAll('path').data(highlights);
                $m.enter().append('path');
                $m.exit().remove();
                $m.attr('d', arc);
            };
            data.on('select', l);
            C.onDOMNodeRemoved($data.node(), function () {
                data.off('select', l);
            });
            data.hist().then(function (hist) {
                _this.hist = hist;
                return resolveHistMax(hist, _this.options.total);
            }).then(function (total) {
                var hist = _this.hist;
                scale.domain([0, total]);
                var hist_data = _this.hist_data = [], prev = 0, cats = hist.categories;
                var cols = hist.colors || d3.scale.category10().range();
                hist.forEach(function (b, i) {
                    hist_data[i] = {
                        name: (typeof cats[i] === 'string') ? cats[i] : cats[i].name,
                        start: prev,
                        size: b,
                        ratio: b / total,
                        end: prev + b,
                        color: (cats[i].color === undefined) ? cols[i] : cats[i].color,
                        range: hist.range(i)
                    };
                    prev += b;
                });
                var $m = $data.selectAll('path').data(hist_data);
                $m.enter()
                    .append('path')
                    .call(tooltip.bind(function (d) { return d.name + ' ' + (d.size) + ' entries (' + Math.round(d.ratio * 100) + '%)'; }))
                    .on('click', function (d) { return data.select(0, d.range, idtypes.toSelectOperation(d3.event)); });
                $m.attr('d', arc)
                    .attr('fill', function (d) { return d.color; })
                    .style('opacity', 0);
                //fade in animation
                $m.transition()
                    .duration(o.duration)
                    .delay(function (d, i) { return i * o.duration; })
                    .style('opacity', 1);
                _this.markReady();
                data.selections().then(function (selected) { return l(null, 'selected', selected); });
            });
            return $svg;
        };
        Pie.prototype.locateImpl = function (range) {
            var that = this, o = this.options;
            if (range.isAll || range.isNone) {
                return Promise.resolve({ x: o.radius, y: o.radius, radius: o.radius });
            }
            return this.data.data(range).then(function (data) {
                var ex = d3.extent(data, function (value) {
                    return that.hist.binOf(value);
                });
                var startAngle = that.scale(that.hist_data[ex[0]].start);
                var endAngle = that.scale(that.hist_data[ex[1]].end);
                return Promise.resolve(toPolygon(startAngle, endAngle, o.radius));
            });
        };
        Pie.prototype.transform = function (scale, rotate) {
            var bak = {
                scale: this.options.scale || [1, 1],
                rotate: this.options.rotate || 0
            };
            if (arguments.length === 0) {
                return bak;
            }
            this.$node.attr({
                width: this.options.radius * 2 * scale[0],
                height: this.options.radius * 2 * scale[1]
            }).style('transform', 'rotate(' + rotate + 'deg)');
            this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')translate(' + this.options.radius + ',' + this.options.radius + ')');
            var new_ = {
                scale: scale,
                rotate: rotate
            };
            this.fire('transform', new_, bak);
            this.options.scale = scale;
            this.options.rotate = rotate;
            return new_;
        };
        return Pie;
    })(vis.AVisInstance);
    exports.Pie = Pie;
    function createHistogram(data, parent, options) {
        return new Histogram(data, parent, options);
    }
    exports.createHistogram = createHistogram;
    function createMosaic(data, parent, options) {
        return new Mosaic(data, parent, options);
    }
    exports.createMosaic = createMosaic;
    function createPie(data, parent, options) {
        return new Pie(data, parent, options);
    }
    exports.createPie = createPie;
});
//# sourceMappingURL=distribution.js.map