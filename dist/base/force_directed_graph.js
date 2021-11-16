/**
 * Created by Samuel Gratzl on 05.08.2014.
 */
import * as d3 from 'd3';
import { AVisInstance, VisUtils } from 'tdp_core';
import { BaseUtils } from 'tdp_core';
export class ForceDirectedGraphVis extends AVisInstance {
    constructor(data, parent, options = {}) {
        super();
        this.data = data;
        this.parent = parent;
        this.options = {
            scale: [1, 1],
            rotate: 0,
            colors: true
        };
        BaseUtils.mixin(this.options, options);
        this.$node = this.build(d3.select(parent));
        this.$node.datum(data);
        VisUtils.assignVis(this.node, this);
    }
    /**
     * the raw size without any scaling factors applied
     * @returns {any[]}
     */
    get rawSize() {
        return [300, 300];
    }
    /**
     * access to the HTML Element of this visualization
     * @returns {Element}
     */
    get node() {
        return this.$node.node();
    }
    /**
     * get/set an option of this vis
     * @param name
     * @param val
     * @returns {any}
     */
    option(name, val) {
        if (arguments.length === 1) {
            return this.options[name];
        }
        else {
            this.fire('option', name, val, this.options[name]);
            this.fire('option.' + name, val, this.options[name]);
            this.options[name] = val;
            //handle option change
        }
    }
    /**
     * transform this visualization given the scaling and rotation factor
     * @param scale a two number array
     * @param rotate a factor in degree
     * @returns {any}
     */
    transform(scale, rotate = 0) {
        const bak = {
            scale: this.options.scale || [1, 1],
            rotate: this.options.rotate || 0
        };
        if (arguments.length === 0) {
            return bak;
        }
        const raw = this.rawSize;
        this.$node.style('transform', 'rotate(' + rotate + 'deg)');
        this.$node.attr('width', raw[0] * scale[0]).attr('height', raw[1] * scale[1]);
        this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
        const act = { scale, rotate };
        this.fire('transform', act, bak);
        this.options.scale = scale;
        this.options.rotate = rotate;
        return act;
    }
    build($parent) {
        //create a svg and append a group for the transform
        const scaleFactor = this.options.scale, size = this.size;
        //create the svg
        const $svg = $parent.append('svg').attr({
            width: size[0],
            height: size[1],
            'class': 'phovea-graph-force'
        });
        const $root = $svg.append('g').attr('transform', 'scale(' + scaleFactor[0] + ',' + scaleFactor[1] + ')');
        const colors = d3.scale.category10().range().slice();
        this.data.impl().then((graph) => {
            const nodes = graph.nodes.map((n) => ({ v: n }));
            const lookup = d3.map(nodes, (d) => String(d.v.id));
            const edges = graph.edges.map((n) => ({
                v: n,
                source: lookup.get(String(n.source.id)),
                target: lookup.get(String(n.target.id))
            }));
            const f = d3.layout.force()
                .size(this.rawSize);
            f.nodes(nodes).links(edges);
            const $links = $root.selectAll('.edge').data(edges);
            $links.enter().append('line').classed('edge', true);
            $links.attr('data-type', (d) => d.v.type);
            $links.exit().remove();
            const $nodes = $root.selectAll('.node').data(nodes);
            $nodes.enter().append('circle')
                .classed('node', true).attr('r', 5)
                .call(f.drag)
                .on('click', (d) => {
                console.log(d.v);
            })
                .append('title');
            $nodes.attr('data-type', (d) => d.v.type);
            if (this.options.colors) {
                $links.style('stroke', (d) => {
                    let c = lookup[d.v.type];
                    if (!c) {
                        c = colors.shift() || 'gray';
                        lookup[d.v.type] = c;
                    }
                    return c;
                });
                $nodes.style('fill', (d) => {
                    let c = lookup[d.v.type];
                    if (!c) {
                        c = colors.shift() || 'gray';
                        lookup[d.v.type] = c;
                    }
                    return c;
                });
            }
            $nodes.select('title').text((d) => d.v.id + ' ' + d.v.type);
            f.on('tick', () => {
                $links.attr({
                    x1: (d) => d.source.x,
                    y1: (d) => d.source.y,
                    x2: (d) => d.target.x,
                    y2: (d) => d.target.y
                });
                $nodes.attr({
                    cx: (d) => d.x,
                    cy: (d) => d.y
                });
            });
            this.markReady();
            f.start();
        });
        return $svg;
    }
    static createForceDirectedGraphVis(data, parent, options) {
        return new ForceDirectedGraphVis(data, parent, options);
    }
}
//# sourceMappingURL=force_directed_graph.js.map