/**
 * Created by Samuel Gratzl on 26.12.2016.
 */


import * as d3 from 'd3';
import {Range} from 'phovea_core';
import {AppContext} from 'phovea_core';
import {IMatrix} from 'phovea_core';
import {SelectionUtils} from 'phovea_core';
import {ESelectOption} from './IHeatMapRenderer';
import {ICommonHeatMapOptions} from './ICommonHeatMapOptions';

export abstract class AHeatMapCanvasRenderer {

  constructor(protected readonly selectAble: ESelectOption = ESelectOption.CELL, protected options: ICommonHeatMapOptions) {

  }

  rescale($node: d3.Selection<any>, dim: number[], scale: number[]) {
    $node.selectAll('canvas.phovea-heatmap-selection').attr({
      width: dim[1] * scale[0],
      height: dim[0] * scale[1]
    });
    if (this.selectAble !== ESelectOption.NONE) {
      $node.datum().productSelections().then((selected) => {
        this.redrawSelection(<HTMLCanvasElement>$node.select('canvas.phovea-heatmap-selection').node(), dim,
        SelectionUtils.defaultSelectionType, selected);
      });
    }
  }

  protected redrawSelection(canvas: HTMLCanvasElement, dim: number[], type: string, selected: Range[]) {
    const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'orange';
    ctx.strokeStyle = 'orange';

    if (selected.length === 0) {
      ctx.restore();
      return;
    }
    if (selected.some((a) => a.isAll)) {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }


    if (this.options.mode === 'sm') {
      ctx.scale(canvas.width / dim[1], canvas.height / dim[0]);
      selected.forEach((cell) => {
        cell.product((indices) => {
          const [i, j] = indices;
          ctx.fillRect(j, i, 1, 1);
        }, dim);
      });
    } else {
      const cw = canvas.width / dim[1];
      const ch = canvas.height / dim[0];
      selected.forEach((cell) => {
        cell.product((indices) => {
          const [i, j] = indices;
          ctx.strokeRect(j * cw, i * ch, cw, ch);
        }, dim);
      });
    }

    ctx.restore();

  }

  protected buildSelection(data: IMatrix<any, any>, $root: d3.Selection<any>, scale: [number, number]) {
    if (this.selectAble === ESelectOption.NONE) {
      return;
    }
    const dims = data.dim;
    const width = dims[1], height = dims[0];

    const $selection = $root.append('canvas').attr({
      width: width * scale[0],
      height: height * scale[1],
      'class': 'phovea-heatmap-selection'
    });

    const toCoord = (evt): [number, number] => {
      const c = <HTMLCanvasElement>$selection.node(),
        rect = c.getBoundingClientRect();
      const x = evt.clientX - rect.left,
        y = evt.clientY - rect.top;
      const i = Math.floor(width * x / c.width),
        j = Math.floor(height * y / c.height);
      return [j, i];
    };

    $selection.on('click', () => {
      const ij = toCoord(d3.event);
      data.selectProduct([Range.cell(...ij)], SelectionUtils.toSelectOperation(<MouseEvent>d3.event));
    });

    const l = (event, type, selected) => {
      this.redrawSelection(<HTMLCanvasElement>$selection.node(), dims, type, selected);
    };

    data.on('selectProduct', l);
    AppContext.getInstance().onDOMNodeRemoved(<Element>$selection.node(), () => {
      data.off('selectProduct', l);
    });
    data.productSelections().then((selected) => {
      this.redrawSelection(<HTMLCanvasElement>$selection.node(), dims, 'selected', selected);
    });
  }
}
