var expect = require('chai').expect;
var Error = require('../Utils/Error.js');
describe('Error handling', function() {
  it('converts error string to error number', function() {
    var validStringToNumber = Error.findError('SECURITY_DECRYPTION_FAILURE');
    var invalidStringToNumber = Error.findError('SOME_RANDOM_ERROR_HERE_WHICH_IS_REALLY_LONG_AND_INVALID');
    expect(validStringToNumber).to.equal(18);
    expect(invalidStringToNumber).to.equal(0);
  });
  it('converts error number to error string', function() {
    var validNumberToString = Error.findError(17);
    var invalidNumberToString = Error.findError(-1);
    expect(validNumberToString).to.equal('SECURITY_ENCRYPTION_FAILURE');
    expect(invalidNumberToString).to.equal('UNKNOWN_ERROR');
  });
  it('returns correct type when it\'s defined', function() {
    var numberToNumber = Error.findError(16, 'number');
    var stringToString = Error.findError('DATABASE_GENERIC', 'string');
    expect(numberToNumber).to.equal(16);
    expect(stringToString).to.equal('DATABASE_GENERIC');
  });
});
