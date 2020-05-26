/**
 * Created by Samuel Gratzl on 26.01.2016.
 */
import '../style.scss';
import * as d3 from 'd3';
import { AppContext, BaseUtils } from 'phovea_core';
import { AVisInstance, VisUtils } from 'phovea_core';
import { SelectionUtils } from 'phovea_core';
import { Vector2D, Polygon } from 'phovea_core';
import { ToolTip } from 'phovea_d3';
import { HistUtils } from './HistData';
export class Pie extends AVisInstance {
    constructor(data, parent, options = {}) {
        super();
        this.data = data;
        this.options = {
            radius: 50,
            innerRadius: 0,
            duration: 200,
            total: true,
            scale: [1, 1],
            rotate: 0
        };
        BaseUtils.mixin(this.options, options);
        this.$node = this.build(d3.select(parent));
        this.$node.datum(this);
        VisUtils.assignVis(this.node, this);
    }
    get rawSize() {
        const r = this.options.radius;
        return [r * 2, r * 2];
    }
    get node() {
        return this.$node.node();
    }
    build($parent) {
        const size = this.size, data = this.data, o = this.options;
        const $svg = $parent.append('svg').attr({
            width: size[0],
            height: size[1],
            'class': 'phovea-pie'
        });
        const $base = $svg.append('g').attr('transform', 'translate(' + o.radius + ',' + o.radius + ')');
        const $data = $base.append('g');
        const $highlight = $base.append('g').style('pointer-events', 'none').classed('phovea-select-selected', true);
        const scale = this.scale = d3.scale.linear().range([0, 2 * Math.PI]);
        const arc = this.arc = d3.svg.arc().innerRadius(o.innerRadius).outerRadius(o.radius)
            .startAngle((d) => scale(d.start))
            .endAngle((d) => scale(d.end));
        const l = (event, type, selected) => {
            if (!this.histData) {
                return;
            }
            const highlights = this.histData.map((entry) => {
                const s = entry.range.intersect(selected);
                return {
                    start: entry.start,
                    end: entry.start + s.size()[0]
                };
            }).filter((entry) => entry.start < entry.end);
            const $m = $highlight.selectAll('path').data(highlights);
            $m.enter().append('path');
            $m.exit().remove();
            $m.attr('d', arc);
        };
        data.on('select', l);
        AppContext.getInstance().onDOMNodeRemoved($data.node(), function () {
            data.off('select', l);
        });
        data.hist().then((hist) => {
            this.hist = hist;
            return HistUtils.resolveHistMax(hist, this.options.total);
        }).then((total) => {
            const hist = this.hist;
            scale.domain([0, total]);
            const histData = this.histData = [], cats = hist.categories;
            let prev = 0;
            const cols = hist.colors || d3.scale.category10().range();
            hist.forEach(function (b, i) {
                histData[i] = {
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
            const $m = $data.selectAll('path').data(histData);
            $m.enter()
                .append('path')
                .call(ToolTip.bind((d) => d.name + ' ' + (d.size) + ' entries (' + Math.round(d.ratio * 100) + '%)'))
                .on('click', (d) => data.select(0, d.range, SelectionUtils.toSelectOperation(d3.event)));
            $m.attr('d', arc)
                .attr('fill', (d) => d.color)
                .style('opacity', 0);
            //fade in animation
            $m.transition()
                .duration(o.duration)
                .delay((d, i) => i * o.duration)
                .style('opacity', 1);
            this.markReady();
            data.selections().then((selected) => l(null, 'selected', selected));
        });
        return $svg;
    }
    locateImpl(range) {
        const o = this.options;
        if (range.isAll || range.isNone) {
            return Promise.resolve({ x: o.radius, y: o.radius, radius: o.radius });
        }
        return this.data.data(range).then((data) => {
            const ex = d3.extent(data, (value) => this.hist.binOf(value));
            const startAngle = this.scale(this.histData[ex[0]].start);
            const endAngle = this.scale(this.histData[ex[1]].end);
            return Promise.resolve(Pie.toPolygon(startAngle, endAngle, o.radius));
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
        this.$node.attr({
            width: this.options.radius * 2 * scale[0],
            height: this.options.radius * 2 * scale[1]
        }).style('transform', 'rotate(' + rotate + 'deg)');
        this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')translate(' + this.options.radius + ',' + this.options.radius + ')');
        const act = { scale, rotate };
        this.fire('transform', act, bak);
        this.options.scale = scale;
        this.options.rotate = rotate;
        return act;
    }
    static createPie(data, parent, options) {
        return new Pie(data, parent, options);
    }
    static toPolygon(start, end, radius) {
        const r = [
            Vector2D.vec2(radius, radius),
            Vector2D.vec2(radius + Math.cos(start) * radius, radius + Math.sin(start) * radius),
            Vector2D.vec2(radius + Math.cos(end) * radius, radius + Math.sin(end) * radius)
        ];
        //approximate by triangle
        if (end - start > Math.PI) { //more than 180 degree use one more point
            r.splice(2, 0, Vector2D.vec2(radius + Math.cos((end - start) * 0.5) * radius, radius + Math.sin((end - start) * 0.5) * radius));
        }
        return Polygon.polygon(r);
    }
}
//# sourceMappingURL=Pie.js.map