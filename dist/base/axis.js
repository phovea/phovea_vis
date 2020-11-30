/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import * as d3 from 'd3';
import { BaseUtils } from 'phovea_core';
import { AVisInstance, VisUtils } from 'phovea_core';
import { D3Utils } from 'phovea_d3';
export class Axis extends AVisInstance {
    constructor(data, parent, options = {}) {
        super();
        this.data = data;
        this.options = {
            shift: 10,
            tickSize: 2,
            orient: 'left',
            r: 2,
            scale: [1, 1],
            rotate: 0
        };
        BaseUtils.mixin(this.options, options);
        this.$node = this.build(d3.select(parent));
        this.$node.datum(this);
        VisUtils.assignVis(this.node, this);
    }
    get rawSize() {
        return [50, 300];
    }
    get node() {
        return this.$node.node();
    }
    build($parent) {
        const o = this.options, size = this.size, data = this.data;
        const $svg = $parent.append('svg').attr({
            width: size[0],
            height: size[1],
            'class': 'phovea-axis'
        });
        const $root = $svg.append('g');
        const $axis = this.$axis = $root.append('g').attr('class', 'makeover');
        const $points = this.$points = $root.append('g');
        const s = this.scale = d3.scale.linear().domain(data.desc.value.range).range([o.shift, ((o.orient === 'left' || o.orient === 'right') ? size[1] : size[0]) - o.shift]).clamp(true);
        const axis = this.axis = d3.svg.axis()
            .tickSize(o.tickSize)
            .orient(o.orient)
            .scale(s);
        switch (o.orient) {
            case 'left':
                $points.attr('transform', 'translate(' + (size[0] - o.shift) + ',0)');
                $axis.attr('transform', 'translate(' + (size[0] - o.shift) + ',0)');
                break;
            case 'right':
                $points.attr('transform', 'translate(' + o.shift + ',0)');
                $axis.attr('transform', 'translate(' + o.shift + ',0)');
                break;
            case 'top':
                $points.attr('transform', 'translate(0, ' + o.shift + ')');
                $axis.attr('transform', 'translate(0,' + o.shift + ')');
                break;
            case 'bottom':
                $points.attr('transform', 'translate(0, ' + (size[1] - o.shift) + ')');
                $axis.attr('transform', 'translate(0,' + (size[1] - o.shift) + ')');
                break;
        }
        $axis.call(axis);
        const onClick = D3Utils.selectionUtil(this.data, $points, 'circle');
        const cxy = (o.orient === 'left' || o.orient === 'right') ? 'cy' : 'cx';
        data.data().then((arr) => {
            const $p = $points.selectAll('circle').data(arr);
            $p.enter().append('circle').attr('r', o.r).on('click', onClick);
            $p.exit().remove();
            $p.attr(cxy, s);
            this.markReady();
        });
        return $svg;
    }
    locateImpl(range) {
        if (range.isAll || range.isNone) {
            const r = this.scale.range();
            return Promise.resolve(this.wrap({ y: r[0], h: r[1] - r[0] }));
        }
        return this.data.data(range).then((data) => {
            const ex = d3.extent(data, this.scale);
            return this.wrap({ y: ex[0], h: ex[1] - ex[0] });
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
        const o = this.options;
        const size = this.rawSize;
        this.$node.attr({
            width: size[0] * scale[0],
            height: size[1] * scale[1]
        }).style('transform', 'rotate(' + rotate + 'deg)');
        this.scale.range([o.shift, ((o.orient === 'left' || o.orient === 'right') ? size[1] * scale[1] : size[0] * scale[0]) - o.shift]);
        const cxy = (o.orient === 'left' || o.orient === 'right') ? 'cy' : 'cx';
        this.$points.selectAll('circle').attr(cxy, this.scale);
        this.$axis.call(this.axis);
        const act = { scale, rotate };
        this.fire('transform', act, bak);
        this.options.scale = scale;
        this.options.rotate = rotate;
        return act;
    }
    wrap(base) {
        const s = this.rawSize;
        switch (this.options.orient) {
            case 'left':
                base.x = s[0] - this.options.shift;
                base.w = 0;
                break;
            case 'right':
                base.x = this.options.shift;
                base.w = 0;
                break;
            case 'top':
                base.x = base.y;
                base.w = base.h;
                base.y = this.options.shift;
                base.h = 0;
                break;
            case 'bottom':
                base.x = base.y;
                base.w = base.h;
                base.y = s[1] - this.options.shift;
                base.h = 0;
                break;
        }
        base.x -= this.options.r;
        base.y -= this.options.r;
        base.w += 2 * this.options.r;
        base.h += 2 * this.options.r;
        return base;
    }
    static createAxis(data, parent, options) {
        return new Axis(data, parent, options);
    }
}
//# sourceMappingURL=axis.js.map