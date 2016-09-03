'use strict';
let expect = require('chai').expect;
let errorHandler = require('../Utils/errorHandler.js');
describe('Error handling', function() {
  it('converts error string to error number', function() {
    let validStringToNumber = errorHandler.findError('SECURITY_DECRYPTION_FAILURE');
    let invalidStringToNumber = errorHandler.findError(
      'SOME_RANDOM_ERROR_HERE_WHICH_IS_REALLY_LONG_AND_INVALID'
    );
    expect(validStringToNumber).to.equal(18);
    expect(invalidStringToNumber).to.equal(0);
  });
  it('converts error number to error string', function() {
    let validNumberToString = errorHandler.findError(17);
    let invalidNumberToString = errorHandler.findError(-1);
    expect(validNumberToString).to.equal('SECURITY_ENCRYPTION_FAILURE');
    expect(invalidNumberToString).to.equal('UNKNOWN_ERROR');
  });
  it('returns correct type when it\'s defined', function() {
    let numberToNumber = errorHandler.findError(16, 'number');
    let stringToString = errorHandler.findError('DATABASE_GENERIC', 'string');
    expect(numberToNumber).to.equal(16);
    expect(stringToString).to.equal('DATABASE_GENERIC');
  });
});
