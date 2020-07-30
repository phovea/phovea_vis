/**
 * Created by Samuel Gratzl on 26.01.2016.
 */
import '../scss/main.scss';
import * as d3 from 'd3';
import { AppContext, BaseUtils } from 'phovea_core';
import { AVisInstance, VisUtils } from 'phovea_core';
import { SelectionUtils } from 'phovea_core';
import { ToolTip } from 'phovea_d3';
import { HistUtils } from './HistData';
export class Histogram extends AVisInstance {
    constructor(data, parent, options = {}) {
        super();
        this.data = data;
        this.options = {
            nbins: 5,
            total: true,
            duration: 200,
            scale: [1, 1],
            rotate: 0
        };
        BaseUtils.mixin(this.options, {
            nbins: Math.floor(Math.sqrt(data.length)),
        }, options);
        this.$node = this.build(d3.select(parent));
        this.$node.datum(this);
        VisUtils.assignVis(this.node, this);
    }
    get rawSize() {
        return [200, 100];
    }
    get node() {
        return this.$node.node();
    }
    build($parent) {
        const size = this.size, data = this.data, o = this.options;
        const $svg = $parent.append('svg').attr({
            width: size[0],
            height: size[1],
            'class': 'phovea-histogram'
        });
        const $t = $svg.append('g');
        const $data = $t.append('g');
        const $highlight = $t.append('g').style('pointer-events', 'none').classed('phovea-select-selected', true);
        //using range bands with an ordinal scale for uniform distribution
        const xscale = this.xscale = d3.scale.ordinal().rangeBands([0, size[0]], 0.1);
        const yscale = this.yscale = d3.scale.linear().range([0, size[1]]);
        const l = (event, type, selected) => {
            if (!this.histData) {
                return;
            }
            const highlights = this.histData.map((entry, i) => {
                const s = entry.range.intersect(selected);
                return {
                    i,
                    v: s.size()[0]
                };
            }).filter((entry) => entry.v > 0);
            const $m = $highlight.selectAll('rect').data(highlights);
            $m.enter().append('rect').attr('width', xscale.rangeBand());
            $m.attr({
                x: (d) => xscale(d.i),
                y: (d) => yscale(yscale.domain()[1] - d.v),
                height: 0
            });
            $m.transition().duration(o.duration).attr('height', function (d) {
                return yscale(d.v);
            });
            $m.exit().remove();
        };
        data.on('select', l);
        AppContext.getInstance().onDOMNodeRemoved($data.node(), function () {
            data.off('select', l);
        });
        const onClick = (d) => data.select(0, d.range, SelectionUtils.toSelectOperation(d3.event));
        this.data.hist(Math.floor(o.nbins)).then((hist) => {
            this.hist = hist;
            xscale.domain(d3.range(hist.bins));
            return HistUtils.resolveHistMax(hist, this.options.total);
        }).then((histmax) => {
            const hist = this.hist;
            yscale.domain([0, histmax]);
            const histData = this.histData = HistUtils.createHistData(hist, this.data);
            const $m = $data.selectAll('rect').data(histData);
            $m.enter().append('rect')
                .attr('width', xscale.rangeBand())
                .call(ToolTip.bind((d) => `${d.name} ${d.v} entries (${Math.round(d.ratio * 100)}%)`))
                .on('click', onClick);
            $m.attr({
                x: (d, i) => xscale(i),
                fill: (d) => this.options.color || d.color,
                y: (d) => yscale(yscale.domain()[1] - d.v),
                height: (d) => yscale(d.v)
            });
            this.markReady();
            data.selections().then((selected) => {
                l(null, 'selected', selected);
            });
        });
        return $svg;
    }
    locateImpl(range) {
        const size = this.rawSize;
        if (range.isAll || range.isNone) {
            return Promise.resolve({ x: 0, y: 0, w: size[0], h: size[1] });
        }
        return this.data.data(range).then((data) => {
            const ex = d3.extent(data, (value) => this.hist.binOf(value));
            const h0 = this.histData[ex[0]];
            const h1 = this.histData[ex[1]];
            return Promise.resolve({
                x: this.xscale(ex[0]),
                width: (this.xscale(ex[1]) - this.xscale(ex[0]) + this.xscale.rangeBand()),
                height: this.yscale(Math.max(h0.v, h1.v)),
                y: this.yscale(this.yscale.domain()[1] - Math.max(h0.v, h1.v))
            });
        });
    }
    transform(scale, rotate) {
        const bak = {
            scale: this.options.scale || [1, 1],
            rotate: this.options.rotate || 0
        };
        if (arguments.length === 0) {
            return bak;
        }
        const size = this.rawSize;
        this.$node.attr({
            width: size[0] * scale[0],
            height: size[1] * scale[1]
        }).style('transform', 'rotate(' + rotate + 'deg)');
        this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
        const act = { scale, rotate };
        this.fire('transform', act, bak);
        this.options.scale = scale;
        this.options.rotate = rotate;
        return act;
    }
    static createHistrogram(data, parent, options) {
        return new Histogram(data, parent, options);
    }
}
//# sourceMappingURL=Histogram.js.map