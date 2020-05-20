/**
 * Created by Samuel Gratzl on 26.12.2016.
 */


import * as d3 from 'd3';
import {Range, cell} from 'phovea_core/src/range';
import {onDOMNodeRemoved} from 'phovea_core/src';
import {toSelectOperation, defaultSelectionType} from 'phovea_core/src/idtype';
import {DefaultUtils} from './DefaultUtils';
import {ICommonHeatMapOptions} from './ICommonHeatMapOptions';
import {IScale} from './IScale';
import {IHeatMapRenderer, ESelectOption} from './IHeatMapRenderer';
import {IHeatMapAbleMatrix} from './HeatMap';

export class HeatMapDOMRenderer implements IHeatMapRenderer {
  private color: IScale;

  constructor(private readonly selectAble: ESelectOption = ESelectOption.CELL, private readonly options: ICommonHeatMapOptions) {

  }

  rescale($node: d3.Selection<any>, dim: number[], scale: number[]) {
    $node.select('svg').attr({
      width: dim[1] * scale[0],
      height: dim[0] * scale[1]
    });
    $node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
  }

  recolor($node: d3.Selection<any>, data: IHeatMapAbleMatrix, color: IScale, scale: number[]) {
    this.color = color;
    this.redraw($node, scale);
  }

  redraw($node: d3.Selection<any>, scale: number[]) {
    $node.select('svg').selectAll('rect')
      .attr('fill', (d) => DefaultUtils.isMissing(d) ? this.options.missingColor : this.color(d))
      .classed('missing', DefaultUtils.isMissing);
  }

  build(data: IHeatMapAbleMatrix, $parent: d3.Selection<any>, scale: [number, number], c: IScale, onReady: () => void) {
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
            data.selectProduct([cell(i, j)], toSelectOperation(<MouseEvent>d3.event));
          });
        }
        $colsEnter.append('title').text(String);

      });
      onReady();
    });
    const l = function (event, type, selected: Range[]) {
      $g.selectAll('rect').classed('phovea-select-' + type, false);
      if (selected.length === 0) {
        return;
      }
      selected.forEach((cell) => {
        cell.product((indices) => {
          const cell = <SVGRectElement>$g.select(`rect[y="${indices[0]}"][x="${indices[1]}"]`).classed('phovea-select-' + type, true).node();
          // push parent to front
          cell.parentElement.appendChild(cell);
          // push parent to front
          cell.parentElement.parentElement.appendChild(cell.parentElement);
        }, data.dim);
      });
    };
    if (this.selectAble !== ESelectOption.NONE) {
      data.on('selectProduct', l);
      onDOMNodeRemoved(<Element>$g.node(), function () {
        data.off('selectProduct', l);
      });
      data.productSelections().then(function (selected) {
        l(null, defaultSelectionType, selected);
      });
    }

    return $node;
  }
}
