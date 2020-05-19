/// <reference types="jest" />
import {Axis} from '../src/axis';

describe('create', () => {
  it('is method', () => {
    expect(typeof Axis.createAxis).toEqual('function');
  });
});
