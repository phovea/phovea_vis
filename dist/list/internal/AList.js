/**
 * Created by Samuel Gratzl on 25.01.2016.
 */
import '../../style.scss';
import { select, extent, selection } from 'd3';
import { BaseUtils } from 'phovea_core';
import { AVisInstance, VisUtils } from 'phovea_core';
import { D3Utils } from 'phovea_d3';
import { Rect } from 'phovea_core';
const DEFAULT_OPTIONS = {
    scale: [1, 1],
    rotate: 0,
    width: 200,
    rowHeight: 20,
    cssClass: ''
};
export class AList extends AVisInstance {
    constructor(data, parent, options) {
        super();
        this.data = data;
        this.parent = parent;
        this.options = BaseUtils.mixin({}, DEFAULT_OPTIONS, options);
        this.$node = select(parent).append('div').attr('class', 'phovea-list ' + this.options.cssClass);
        this.$node.datum(this);
        VisUtils.assignVis(this.node, this);
    }
    get rawSize() {
        return [this.options.width, this.data.length * this.options.rowHeight];
    }
    get node() {
        return this.$node.node();
    }
    locateImpl(range) {
        const w = this.node.clientWidth;
        const $node = select(this.node);
        let a, b;
        if (range.isAll || range.isNone) {
            a = this.node.firstElementChild;
            b = this.node.lastElementChild;
        }
        else {
            const ex = extent(range.dim(0).iter().asList());
            a = this.node.childNodes.item(ex[0]);
            b = this.node.childNodes.item(ex[1]);
        }
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
        this.$node.style('transform', 'rotate(' + rotate + 'deg)');
        this.$node.style('width', `${scale[0] * this.options.width}px`);
        this.$node.style('height', `${scale[1] * this.data.length * this.options.rowHeight}px`);
        const act = { scale, rotate };
        this.fire('transform', act, bak);
        this.options.scale = scale;
        this.options.rotate = rotate;
        this.update();
        return act;
    }
    update() {
        this.render(selection(), this.$node.selectAll('div'));
    }
    build() {
        const scale = this.options.scale;
        this.$node.style('width', `${scale[0] * this.options.width}px`);
        this.$node.style('height', `${scale[1] * this.data.length * this.options.rowHeight}px`);
        const onClick = D3Utils.selectionUtil(this.data, this.$node, 'div');
        this.data.data().then((arr) => {
            const $rows = this.$node.selectAll('div').data(arr);
            const $rowsEnter = $rows.enter().append('div').on('click', onClick);
            this.render($rowsEnter, $rows);
            $rows.exit().remove();
            this.markReady();
        });
    }
}
//# sourceMappingURL=AList.js.map