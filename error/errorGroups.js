//Require our generic error
var ExtendableError = require('./ExtendableError.js');
//Export error object
module.exports = {
  DatabaseError: class DatabaseError extends ExtendableError {
    constructor (message) {
      super(message);
    }
  },

  GenericError: class GenericError extends ExtendableError {
    constructor (message) {
      super(message);
    }
  },

  HandshakeError: class HandshakeError extends ExtendableError {
    constructor (message) {
      super(message);
    }
  },

  VerificationError: class VerificationError extends ExtendableError {
    constructor (message) {
      super(message);
    }
  },

  RequestError: class RequestError extends ExtendableError {
    constructor (message) {
      super(message);
    }
  },

  SubmitError: class SubmitError extends ExtendableError {
    constructor (message) {
      super(message);
    }
  },

  SecurityError: class SecurityError extends ExtendableError {
    constructor (message) {
      super(message);
    }
  }
};
