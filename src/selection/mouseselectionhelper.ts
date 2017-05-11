import * as d3 from 'd3';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {SelectOperation} from 'phovea_core/src/idtype/IIDType';
import {fire} from 'phovea_core/src/event';
import List from '../list';

export class MouseSelectionHelper {
  topBottom : number[];
  mouseLeft : boolean = false;
  constructor(private mouseListener : d3.Selection<any>, private mouseLeaveObject : d3.Selection<any>, private data: any) {
    this.topBottom = [-1, -1];
  }

  installListeners(onClickAdd, onClickRemove) {
    this.mouseListener.on('mousedown', (d, i) => {
      this.resetTopbottom();
      this.updateTopBottom(i, this.topBottom[1], this.topBottom);
      if (toSelectOperation(<MouseEvent>d3.event) === SelectOperation.SET) {
        this.data.clear();
        fire(List.EVENT_BRUSH_CLEAR, this.data);
      }
    })
    .on('mouseenter', (d, i) => {
      if(this.topBottom[0] !== -1) {
        this.removeOldSelectedElements(this.topBottom, i, onClickRemove);
        this.updateTopBottom(this.topBottom[0], i, this.topBottom);
        this.selectTopBottom(this.topBottom, onClickAdd);
      }
    })
    .on('mouseup', (d, i) => {
      if(this.topBottom[0] !== -1) {
        this.updateTopBottom(this.topBottom[0], i, this.topBottom);
        this.selectTopBottom(this.topBottom, onClickAdd);
        this.topBottom.sort((a, b) => a - b);
        fire(List.EVENT_BRUSHING, this.topBottom, this.data);
        this.resetTopbottom();
      }
    });

    this.mouseLeaveObject.on('mouseleave', (d, i) => {
       if(this.topBottom[0] !== -1) {
        this.selectTopBottom(this.topBottom, onClickAdd);
        this.topBottom.sort((a, b) => a - b);
        fire(List.EVENT_BRUSHING, this.topBottom, this.data);
        this.resetTopbottom();
      }
    });

    document.documentElement.addEventListener('mouseup', function(e){
      console.log(e);
    });
  }

  private resetTopbottom() {
    this.updateTopBottom(-1, -1, this.topBottom);
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
    if(topBottom[1] === -1) {
      return;
    }
    const removeIndices = [topBottom[1], i];

    // when turning mouse from down to up
    if(topBottom[0] < topBottom[1]) {
      for (let j = removeIndices[1] + 1; j <= removeIndices[0]; j++) {
        onClickRemove('', j);
      }
    } else if(topBottom[0] > topBottom[1]) { // when turning mouse from up to down
      for (let j = removeIndices[0]; j < removeIndices[1]; j++) {
        onClickRemove('', j);
      }
    }
  }
}
