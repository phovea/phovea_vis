/**
 * Created by Samuel Gratzl on 05.08.2014.
 */
import './style.scss';
import * as d3 from 'd3';
import { AVisInstance, VisUtils } from 'phovea_core';
import { Rect } from 'phovea_core';
import { D3Utils } from 'phovea_d3';
import { BaseUtils } from 'phovea_core';
export class Table extends AVisInstance {
    constructor(data, parent, options = {}) {
        super();
        this.data = data;
        this.options = {
            scale: [1, 1],
            rotate: 0
        };
        BaseUtils.mixin(this.options, options);
        const $p = d3.select(parent);
        switch (data.desc.type) { //depending on the type of the data, create a different table
            case 'matrix':
                const dmatrix = data;
                this.$node = this.build($p, [dmatrix.cols(), dmatrix.rows(), dmatrix.data()]);
                break;
            case 'table':
                const dtable = data;
                this.$node = this.build($p, [dtable.cols().map((v) => v.desc.name), dtable.rows(), this.data.data()]);
                break;
            case 'vector':
                const dvector = data;
                this.$node = this.build($p, [
                    [dvector.desc.name],
                    dvector.names(),
                    dvector.data().then((data) => data.map((d) => [d]))
                ]);
                break;
        }
        this.$node.datum(data);
        VisUtils.assignVis(this.node, this);
    }
    get rawSize() {
        const dim = this.data.dim;
        return [(dim[1] || 1) * 200, dim[0] * 22];
    }
    get node() {
        return this.$node.node();
    }
    locateImpl(range) {
        const $tbody = d3.select(this.node).select('tbody');
        const offset = $tbody.node().offsetTop, w = $tbody.node().clientWidth;
        let a, b;
        if (range.isAll || range.isNone) {
            b = $tbody.select('tr:last').node();
            return Promise.resolve(Rect.rect(0, offset, w, b.offsetTop + b.clientHeight));
        }
        const ex = d3.extent(range.dim(0).iter().asList());
        a = $tbody.select('tr:nth-child(' + (ex[0] + 1) + ')').node();
        b = $tbody.select('tr:nth-child(' + (ex[1] + 1) + ')').node();
        return Promise.resolve(Rect.rect(0, a.offsetTop, w, b.offsetTop + b.clientHeight - a.offsetTop));
    }
    transform(scale, rotate = 0) {
        const bak = {
            scale: this.options.scale || [1, 1],
            rotate: this.options.rotate || 0
        };
        if (arguments.length === 0) {
            return bak;
        }
        this.$node.style('transform', 'rotate(' + rotate + 'deg)scale(' + scale[0] + ',' + scale[1] + ')');
        const act = { scale, rotate };
        this.fire('transform', act, bak);
        this.options.scale = scale;
        this.options.rotate = rotate;
        return act;
    }
    build($parent, promises) {
        const $table = $parent.append('table').attr('class', 'phovea-table');
        $table.append('thead').append('tr');
        $table.append('tbody');
        const onClick = D3Utils.selectionUtil(this.data, $table.select('tbody'), 'tr');
        Promise.all(promises).then((arr) => {
            const cols = arr[0], rows = arr[1], d = arr[2];
            const $headers = $table.select('thead tr').selectAll('th').data(['ID'].concat(cols));
            $headers.enter().append('th');
            $headers.text(String);
            $headers.exit().remove();
            const $rows = $table.select('tbody').selectAll('tr').data(d);
            $rows.enter().append('tr').on('click', onClick);
            $rows.each(function (row, i) {
                const $header = d3.select(this).selectAll('th').data(rows.slice(i, i + 1));
                $header.enter().append('th');
                $header.text(String);
                $header.exit().remove();
                const $row = d3.select(this).selectAll('td').data(row);
                $row.enter().append('td');
                $row.text(String);
                $row.exit().remove();
            });
            $rows.exit().remove();
            this.markReady();
        });
        return $table;
    }
    static createTable(data, parent, options) {
        return new Table(data, parent, options);
    }
}
//# sourceMappingURL=table.js.map