/// <reference types="jest" />
import {Axis} from '../dist/base/axis';

describe('create', () => {
  it('is method', () => {
    expect(typeof Axis.createAxis).toEqual('function');
  });
});
