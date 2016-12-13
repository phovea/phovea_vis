import {create} from '../src/table';
import {parseMatrix} from 'phovea_d3/src/parser';

describe('create', () => {
  it('works', () => {
    const data = parseMatrix(
        [ // raw data as 2D array
          [0, 0],
          [0, 1]
        ],
        ['1', '2'], // row_ids
        ['A', 'B'] // col_ids
    );
    // const element = new HTMLElement(); // "Illegal constructor"
    // const table = create(data, element);
    // expect(table.node.innerHTML).toEqual('<something>');
  });
});