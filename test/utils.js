'use strict';
let expect = require('chai').expect;
let errorHandler = require('../error/errorHandler.js');
describe('Error handling', function() {
  it('converts error object to error instance', function() {
    const validError = errorHandler.createError({
      name: 'SecurityEncryptionFailure',
      message: 'valid error'
    });
    const invalidError = errorHandler.createError({
      name: 'SomeInvalidErrorThatCannotBeFound',
      message: 'invalid error'
    });
    expect(validError.toString()).to.equal('SecurityEncryptionFailure: valid error');
    expect(invalidError.toString()).to.equal('Error: invalid error');
  });
});