/// <reference types="jest" />
import {Table} from '../src/table';
import {asMatrix as parseMatrix} from 'phovea_core/src/matrix';
import {parse} from 'phovea_core/src/range';

describe('table', () => {
  let squareTable;
  let colTable;
  let rowTable;
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
    squareTable = Table.createTable(data, element);
    colTable = Table.createTable(data.view(parse([[0,1],[1]])), element);
    rowTable = Table.createTable(data.view(parse([[1],[0,1]])), element);
    setTimeout(function() {
      done();
    }, 1000); // TODO: Can we do better than this? create() doesn't let us provide a callback?
  });
  it('renders', () => {
    expect(squareTable.node.innerHTML).toEqual(
        '<thead><tr><th>ID</th><th>A</th><th>B</th></tr></thead>'
        +'<tbody>'
        +'<tr><th>X</th><td>1</td><td>2</td></tr><tr>'
        +'<th>Y</th><td>3</td><td>4</td></tr>'
        +'</tbody>');
    expect(colTable.node.innerHTML).toEqual(
        '<thead><tr><th>ID</th><th>A</th><th>B</th></tr></thead>' // TODO: Should just be "B", right?
        +'<tbody>'
        +'<tr><th>X</th><td>2</td></tr>'
        +'<tr><th>Y</th><td>4</td></tr>'
        +'</tbody>');
    expect(rowTable.node.innerHTML).toEqual(
        '<thead><tr><th>ID</th><th>B</th></tr></thead>' // TODO: Should be "A" + "B", right?
        +'<tbody>'
        +'<tr><th>Y</th><td>3</td><td>4</td></tr>'
        +'</tbody>');
  });
});

// TODO
// describe('MatrixView', () => {
//   it('sub-selects columns', () => {
//     const matrix = parseMatrix(
//         [ // raw data as 2D array
//           [1, 2],
//           [3, 4]
//         ],
//         ['X', 'Y'], // row_ids
//         ['A', 'B'] // col_ids
//     );
//     const col_range = parse([[0,1],[1]]);
//     const view = new MatrixView(matrix, col_range);
//     expect(view.cols()).toEqual("foo");
//   })
// });
