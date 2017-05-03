import * as d3 from 'd3';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {SelectOperation} from 'phovea_core/src/idtype/IIDType';
import {fire} from 'phovea_core/src/event';
import List from '../list';

export class MouseSelectionHelper {
  topBottom : number[];
  constructor(private mouseDownObject : d3.Selection<any>, private mouseEnterObject : d3.Selection<any>,
                              private mouseUpObject : d3.Selection<any>, private mouseLeaveObject : d3.Selection<any>, private data: any) {
    this.topBottom = [-1, -1];
  }

  installListeners(onClickAdd, onClickRemove) {
    this.mouseDownObject.on('mousedown', (d, i) => {
      this.updateTopBottom(-1, -1, this.topBottom);
      this.updateTopBottom(i, this.topBottom[1], this.topBottom);
      if (toSelectOperation(<MouseEvent>d3.event) === SelectOperation.SET) {
        this.data.clear();
        fire(List.EVENT_BRUSH_CLEAR, this.data);
      }
    });

    this.mouseEnterObject.on('mouseenter', (d, i) => {
        if(this.topBottom[0] !== -1) {
          this.removeOldSelectedElements(this.topBottom, i, onClickRemove);
          this.updateTopBottom(this.topBottom[0], i, this.topBottom);
          this.selectTopBottom(this.topBottom, onClickAdd);
        }
      })

    this.mouseUpObject.on('mouseup', (d, i) => {
      if(this.topBottom[0] !== -1) {
        this.updateTopBottom(this.topBottom[0], i, this.topBottom);
        this.selectTopBottom(this.topBottom, onClickAdd);
        this.topBottom.sort((a, b) => a - b);
        fire(List.EVENT_BRUSHING, this.topBottom, this.data);
      }
    }).append('title').text((d) => String(d));

    this.mouseLeaveObject.on('mouseleave', (d, i) => {
      this.selectTopBottom(this.topBottom, onClickRemove);
      this.updateTopBottom(-1, -1, this.topBottom);
    });
  }

  private selectTopBottom(topBottom: number[], onClick) {
    const copy = topBottom.slice();
    copy.sort((a, b) => a - b);
    for(let i = copy[0]; i <= copy[1]; i++) {
      onClick('', i);
    }
  }
  private updateTopBottom(top: number, bottom: number, topBottom: number[]) {
    topBottom[0] = top;
    topBottom[1] = bottom;
  }

  private removeOldSelectedElements(topBottom: number[], i : number, onClickRemove) {
    if(topBottom[1] == -1)
      return;
    const removeIndices = [topBottom[1], i];

    // when turning mouse from down to up
    if(topBottom[0] < topBottom[1]) {
      for (let j = removeIndices[1] + 1; j <= removeIndices[0]; j++) {
        onClickRemove('', j);
      }
    }
    // when turning mouse from up to down
    else if(topBottom[0] > topBottom[1]) {
      for (let j = removeIndices[0]; j < removeIndices[1]; j++) {
        onClickRemove('', j);
      }
    }
  }
}
