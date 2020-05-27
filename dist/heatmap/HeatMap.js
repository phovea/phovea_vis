/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import '../style.scss';
import * as d3 from 'd3';
import { AVisInstance, VisUtils } from 'phovea_core';
import { Rect } from 'phovea_core';
import { BaseUtils, AppContext } from 'phovea_core';
import { SelectionUtils } from 'phovea_core';
import { AMatrix } from 'phovea_core';
import { DefaultUtils } from './DefaultUtils';
import { ScaleUtils } from './IScale';
import { ESelectOption } from './IHeatMapRenderer';
import { HeatMapDOMRenderer } from './HeatMapDOMRenderer';
import { HeatMapImageRenderer } from './HeatMapImageRenderer';
import { HeatMapCanvasRenderer } from './HeatMapCanvasRenderer';
import { HeatMap1D } from './HeatMap1D';
export class HeatMap extends AVisInstance {
    constructor(data, parent, options = {}) {
        super();
        this.data = data;
        this.parent = parent;
        this.options = {
            initialScale: 10,
            scaleTo: null,
            duration: 200,
            selectAble: true,
            forceThumbnails: false,
            scale: [1, 1],
            rotate: 0,
            labels: ESelectOption.NONE,
            missingColor: '#d400c2',
            mode: 'sm'
        };
        const value = this.data.valuetype;
        BaseUtils.mixin(this.options, {
            color: DefaultUtils.defaultColor(value),
            domain: DefaultUtils.defaultDomain(value)
        }, options);
        // if direct scale not given use initial scale
        if (!options.scale) {
            this.options.scale = [this.options.initialScale, this.options.initialScale];
        }
        if (this.options.scaleTo) {
            const raw = this.data.dim;
            this.options.scale = this.options.scaleTo.map((d, i) => d / raw[i]);
        }
        this.options.rotate = 0;
        this.colorer = ScaleUtils.toScale(value).domain(this.options.domain).range(this.options.color);
        // handle string case
        this.options.labels = typeof this.options.labels === 'string' ? ESelectOption[this.options.labels] : this.options.labels;
        const selection = typeof this.options.selectAble === 'boolean' ? (this.options.selectAble ? ESelectOption.CELL : ESelectOption.NONE) : ESelectOption[this.options.selectAble];
        this.renderer = HeatMap.createRenderer(data, selection, this.options);
        this.$node = this.build(d3.select(parent));
        this.$node.datum(data);
        VisUtils.assignVis(this.node, this);
    }
    get rawSize() {
        const d = this.data.dim;
        return [d[1], d[0]];
    }
    get node() {
        return this.$node.node();
    }
    option(name, val) {
        if (arguments.length === 1) {
            return this.options[name];
        }
        else {
            this.fire('option', name, val, this.options[name]);
            this.fire('option.' + name, val, this.options[name]);
            this.options[name] = val;
            switch (name) {
                case 'color':
                case 'domain':
                    this.recolor();
                    break;
            }
        }
    }
    locateImpl(range) {
        const dims = this.data.dim;
        const width = dims[1], height = dims[0], o = this.options;
        function l(r, max, s) {
            if (r.isAll || r.isNone) {
                return [0, max * s];
            }
            const ex = d3.extent(r.iter().asList());
            return [ex[0] * s, (ex[1] - ex[0] + 1) * s];
        }
        const xw = l(range.dim(1), width, o.scale[0]);
        const yh = l(range.dim(0), height, o.scale[1]);
        return Promise.resolve(Rect.rect(xw[0], yh[0], xw[1], yh[1]));
    }
    transform(scale, rotate = 0) {
        const bak = {
            scale: this.options.scale || [1, 1],
            rotate: this.options.rotate || 0
        };
        if (arguments.length === 0) {
            return bak;
        }
        const dims = this.data.dim;
        this.$node.style('transform', 'rotate(' + rotate + 'deg)');
        if (bak.scale[0] !== scale[0] || bak.scale[1] !== scale[1]) {
            this.renderer.rescale(this.$node, dims, scale);
            if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.ROW) {
                this.$node.select('div.row-labels')
                    .style('height', dims[0] * scale[1] + 'px')
                    .style('right', dims[1] * scale[0] + 'px');
            }
            if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.COLUMN) {
                this.$node.select('div.column-labels')
                    .style('height', dims[1] * scale[0] + 'px');
            }
        }
        const act = { scale, rotate };
        this.fire('transform', act, bak);
        this.options.scale = scale;
        this.options.rotate = rotate;
        return act;
    }
    recolor() {
        const c = this.colorer;
        c.domain(this.options.domain).range(this.options.color);
        this.renderer.recolor(this.$node, this.data, c, this.options.scale);
    }
    build($parent) {
        const $node = this.renderer.build(this.data, $parent, this.options.scale, this.colorer, () => {
            this.renderer.redraw(this.$node, this.options.scale);
            this.markReady();
        });
        if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.ROW) {
            this.renderLabels($node, ESelectOption.ROW, this.data.rows())
                .style('height', this.size[1] + 'px')
                .style('right', this.size[0] + 'px');
        }
        if (this.options.labels === ESelectOption.CELL || this.options.labels === ESelectOption.COLUMN) {
            this.renderLabels($node, ESelectOption.COLUMN, this.data.cols())
                .style('height', this.size[0] + 'px');
        }
        return $node;
    }
    renderLabels($node, mode, names) {
        const dim = mode === ESelectOption.ROW ? AMatrix.DIM_ROW : AMatrix.DIM_COL;
        const $group = $node.append('div').attr('class', 'phovea-heatmap-labels ' + (mode === ESelectOption.ROW ? 'row-labels' : 'column-labels'));
        const l = function (event, type, selected) {
            const all = $group.selectAll('div');
            all.classed('phovea-select-' + type, false);
            const dimSelections = selected.dim(dim);
            if (dimSelections.isAll && !selected.dim(1 - dim).isAll) {
                return;
            }
            const sub = dimSelections.filter(all[0]);
            if (sub.length > 0) {
                d3.selectAll(sub).classed('phovea-select-' + type, true);
            }
        };
        names.then((data) => {
            const $names = $group.selectAll('div').data(data);
            $names.enter().append('div').on('click', (d, i) => {
                this.data.select(dim, [i], SelectionUtils.toSelectOperation(d3.event));
            });
            $names.text(String);
            $names.exit().remove();
            this.data.selections().then((selected) => {
                l(null, 'selected', selected);
            });
        });
        this.data.on('select', l);
        AppContext.getInstance().onDOMNodeRemoved($group.node(), () => {
            this.data.off('select', l);
        });
        return $group;
    }
    update() {
        this.renderer.redraw(this.$node, this.options.scale);
    }
    static createRenderer(d, selectAble = ESelectOption.CELL, options) {
        const cells = d.length;
        if (cells <= 1000) {
            return new HeatMapDOMRenderer(selectAble, options);
        }
        const url = d.heatmapUrl(); //can the url be created the return value should be valid
        if (url && options.forceThumbnails) {
            return new HeatMapImageRenderer(selectAble, options);
        }
        else if (cells < 5000 || url === null) {
            return new HeatMapCanvasRenderer(selectAble, options);
        }
        else {
            return new HeatMapImageRenderer(selectAble, options);
        }
    }
    static create2D(data, parent, options) {
        return new HeatMap(data, parent, options);
    }
    static createHeatMapDimensions(data, parent, options) {
        if (data.desc.type === 'matrix') {
            return HeatMap.create2D(data, parent, options);
        }
        else if (data.desc.type === 'vector') {
            return HeatMap1D.create1D(data, parent, options);
        }
        throw new Error('unknown data type: ' + data.desc.type);
    }
}
//# sourceMappingURL=HeatMap.js.map