/**
 * Created by Samuel Gratzl on 26.12.2016.
 */
import * as d3 from 'd3';
import { Range } from 'tdp_core';
import { AppContext } from 'tdp_core';
import { SelectionUtils } from 'tdp_core';
import { DefaultUtils } from './DefaultUtils';
import { ESelectOption } from './IHeatMapRenderer';
export class HeatMapDOMRenderer {
    constructor(selectAble = ESelectOption.CELL, options) {
        this.selectAble = selectAble;
        this.options = options;
    }
    rescale($node, dim, scale) {
        $node.select('svg').attr({
            width: dim[1] * scale[0],
            height: dim[0] * scale[1]
        });
        $node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
    }
    recolor($node, data, color, scale) {
        this.color = color;
        this.redraw($node, scale);
    }
    redraw($node, scale) {
        $node.select('svg').selectAll('rect')
            .attr('fill', (d) => DefaultUtils.isMissing(d) ? this.options.missingColor : this.color(d))
            .classed('missing', DefaultUtils.isMissing);
    }
    build(data, $parent, scale, c, onReady) {
        const dims = data.dim, that = this;
        const width = dims[1], height = dims[0];
        const $node = $parent.append('div').attr('class', 'phovea-heatmap ' + this.options.mode);
        const $svg = $node.append('svg').attr({
            width: width * scale[0],
            height: height * scale[1]
        });
        const $g = $svg.append('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
        this.color = c;
        data.data().then((arr) => {
            const $rows = $g.selectAll('g').data(arr);
            $rows.enter().append('g').each(function (row, i) {
                const $cols = d3.select(this).selectAll('rect').data(row);
                const $colsEnter = $cols.enter().append('rect').attr({
                    width: 1,
                    height: 1,
                    x: (d, j) => j,
                    y: i,
                    fill: (d) => DefaultUtils.isMissing(d) ? that.options.missingColor : c(d)
                });
                $colsEnter.classed('missing', DefaultUtils.isMissing);
                if (that.selectAble !== ESelectOption.NONE) {
                    $colsEnter.on('click', (d, j) => {
                        data.selectProduct([Range.cell(i, j)], SelectionUtils.toSelectOperation(d3.event));
                    });
                }
                $colsEnter.append('title').text(String);
            });
            onReady();
        });
        const l = function (event, type, selected) {
            $g.selectAll('rect').classed('phovea-select-' + type, false);
            if (selected.length === 0) {
                return;
            }
            selected.forEach((cell) => {
                cell.product((indices) => {
                    const cell = $g.select(`rect[y="${indices[0]}"][x="${indices[1]}"]`).classed('phovea-select-' + type, true).node();
                    // push parent to front
                    cell.parentElement.appendChild(cell);
                    // push parent to front
                    cell.parentElement.parentElement.appendChild(cell.parentElement);
                }, data.dim);
            });
        };
        if (this.selectAble !== ESelectOption.NONE) {
            data.on('selectProduct', l);
            AppContext.getInstance().onDOMNodeRemoved($g.node(), function () {
                data.off('selectProduct', l);
            });
            data.productSelections().then(function (selected) {
                l(null, SelectionUtils.defaultSelectionType, selected);
            });
        }
        return $node;
    }
}
//# sourceMappingURL=HeatMapDOMRenderer.js.map