import {create} from '../src/table';
import {parseMatrix} from 'phovea_d3/src/parser';
import {parse} from 'phovea_core/src/range';

describe('table', () => {
  var square_table;
  var col_table;
  var row_table;
  beforeEach(function(done) {
    // Yes, this is redundant, but it's ok for now.
    const data = parseMatrix(
        [ // raw data as 2D array
          [1, 2],
          [3, 4]
        ],
        ['X', 'Y'], // row_ids
        ['A', 'B'] // col_ids
    );
    const element = document.createElement('div');
    square_table = create(data, element);
    col_table = create(data.view(parse([[0,1],[1]])), element);
    row_table = create(data.view(parse([[1],[0,1]])), element);
    setTimeout(function() {
      done();
    }, 1000); // TODO: Can we do better than this? create() doesn't let us provide a callback?
  });
  it('renders', () => {
    expect(square_table.node.innerHTML).toEqual(
        '<thead><tr><th>ID</th><th>A</th><th>B</th></tr></thead>'
        +'<tbody>'
        +'<tr><th>X</th><td>1</td><td>2</td></tr><tr>'
        +'<th>Y</th><td>3</td><td>4</td></tr>'
        +'</tbody>');
    expect(col_table.node.innerHTML).toEqual(
        '<thead><tr><th>ID</th><th>A</th><th>B</th></tr></thead>' // TODO: Should just be "B", right?
        +'<tbody>'
        +'<tr><th>X</th><td>2</td></tr>'
        +'<tr><th>Y</th><td>4</td></tr>'
        +'</tbody>');
    expect(row_table.node.innerHTML).toEqual(
        '<thead><tr><th>ID</th><th>B</th></tr></thead>' // TODO: Should be "A" + "B", right?
        +'<tbody>'
        +'<tr><th>Y</th><td>3</td><td>4</td></tr>'
        +'</tbody>');
  });
});
