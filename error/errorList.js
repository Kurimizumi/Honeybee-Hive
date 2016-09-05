//Require our error groups object
const errorGroups = require('./errorGroups.js');
//Export error object
module.exports = {
  //Database errors
  //Generic database error
  DatabaseGeneric: class DatabaseGeneric
      extends errorGroups.DatabaseError {
    constructor (message) {
      super(message);
    }
  },
  //Document not found in database
  DatabaseNotFound: class DatabaseNotFound
      extends errorGroups.DatabaseError {
    constructor (message) {
      super(message);
    }
  },

  //Generic errors for use anywhere
  //If the payload is not present
  GenericPayloadMissing: class GenericPayloadMissing
      extends errorGroups.GenericError {
    constructor (message) {
      super(message);
    }
  },
  //If parameters are missing (e.g. type)
  GenericParametersMissing: class GenericParametersMissing
      extends errorGroups.GenericError {
    constructor (message) {
      super(message);
    }
  },
  //If security information is missing (e.g. iv)
  GenericSecurityInformationMissing: class GenericSecurityInformationMissing
      extends errorGroups.GenericError {
    constructor (message) {
      super(message);
    }
  },

  //Handshake errors
  //Generic handshake error
  HandshakeGeneric: class HandshakeGeneric
          extends errorGroups.HandshakeError {
    constructor (message) {
      super(message);
    }
  },
  //If a key isn't given by the client
  HandshakeKeyMissing: class HandshakeKeyMissing
      extends errorGroups.HandshakeError {
    constructor (message) {
      super(message);
    }
  },
  //If the hanshake fails later on (e.g. not encrypted properly)
  HandshakePostCompleteFailure: class HandshakePostCompleteFailure
          extends errorGroups.HandshakeError {
    constructor (message) {
      super(message);
    }
  },

  //Verification errors
  //Generic verification error
  VerificationGeneric: class VerificationGeneric
      extends errorGroups.VerificationError {
    constructor (message) {
      super(message);
    }
  },
  //If the user hasn't verified themselves when trying to do an authenticated
  //operation
  VerificationNotExecuted: class VerificationNotExecuted
      extends errorGroups.VerificationError {
    constructor (message) {
      super(message);
    }
  },

  //Request errors
  //If there's no work remaining
  RequestNoWork: class RequestNoWork
      extends errorGroups.RequestError {
    constructor (message) {
      super(message);
    }
  },
  //If the user has unsubmitted work
  RequestPendingWork: class RequestPendingWork
      extends errorGroups.RequestError {
    constructor (message) {
      super(message);
    }
  },

  //Submit errors
  //The user hasn't submitted any work with their message
  SubmitNoData: class SubmitNoData
      extends errorGroups.SubmitError {
    constructor (message) {
      super(message);
    }
  },

  //Security errors
  //Key format is invalid
  SecurityInvalidKey: class SecurityInvalidKey
      extends errorGroups.SecurityError {
    constructor (message) {
      super(message);
    }
  },
  //Key failed to generate
  SecurityKeyGenerationFailure: class SecurityKeyGenerationFailure
      extends errorGroups.SecurityError {
    constructor (message) {
      super(message);
    }
  },
  //Encryption failed
  SecurityEncryptionFailure: class SecurityEncryptionFailure
      extends errorGroups.SecurityError {
    constructor (message) {
      super(message);
    }
  },
  //Decryption failed
  SecurityDecryptionFailure: class SecurityDecryptionFailure
      extends errorGroups.SecurityError {
    constructor (message) {
      super(message);
    }
  },
  //Signing a message failed
  SecuritySigningFailure: class SecuritySigningFailure
      extends errorGroups.SecurityError {
    constructor (message) {
      super(message);
    }
  },
  //Verification of a message failed
  SecurityVerificationFailure: class SecurityVerificationFailure
      extends errorGroups.SecurityFailure {
    constructor (message) {
      super(message);
    }
  }
};
