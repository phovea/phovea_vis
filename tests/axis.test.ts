/// <reference types="jasmine" />
import {create} from '../src/axis';

describe('create', () => {
  it('is method', () => {
    expect(typeof create).toEqual('function');
  });
});
