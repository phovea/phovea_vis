import {create} from '../src/table';
import {parseMatrix} from 'phovea_d3/src/parser';

describe('square table', () => {
  var table;
  beforeEach(function(done) {
    const data = parseMatrix(
        [ // raw data as 2D array
          [1, 2],
          [3, 4]
        ],
        ['X', 'Y'], // row_ids
        ['A', 'B'] // col_ids
    );
    const element = document.createElement('div');
    table = create(data, element);
    setTimeout(function() {
      done();
    }, 1000); // TODO: Can we do better than this? create() doesn't let us provide a callback?
  });
  it('works', () => {
    expect(table.node.innerHTML).toEqual(
        '<thead><tr><th>ID</th><th>A</th><th>B</th></tr></thead>'
        +'<tbody>'
        +'<tr><th>X</th><td>1</td><td>2</td></tr><tr>'
        +'<th>Y</th><td>3</td><td>4</td></tr>'
        +'</tbody>');
  });
});
