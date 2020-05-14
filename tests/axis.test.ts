/// <reference types="jest" />
import {createAxis} from '../src/axis';

describe('create', () => {
  it('is method', () => {
    expect(typeof createAxis).toEqual('function');
  });
});
