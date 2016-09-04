'use strict';
//List of errors
const errors = [
  //Unknown errors
  'UNKNOWN_ERROR', //ONLY FOR USE IF THE ERROR IS COMPLETELY UNKNOWN
  //Database errors
  'DATABASE_GENERIC', //Generic database error
  'DATABASE_NOT_FOUND', //Document not found
  //Generic errors
  'GENERIC_PAYLOAD_MISSING', //For use anywhere, if the payload is missing
  'GENERIC_PARAMETERS_MISSING', //For use anywhere where parameters are missing
  'GENERIC_MISSING_SECURITY_INFORMATION', //If security information is missing
  //Handshake stage errors
  'STAGE_HANDSHAKE_GENERIC', //Generic handshake stage error
  'STAGE_HANDSHAKE_KEY_MISSING', //Missing key
  'STAGE_HANDSHAKE_POST_COMPLETE_FAILURE', //Handshake failure in another area
  //Verification stage errors
  'STAGE_VERIFICATION_GENERIC', //Generic verification stage error
  'STAGE_VERIFICATION_NOT_EXECUTED', //For when the user isn't verified
  //Request stage errors
  'STAGE_REQUEST_NO_WORK', //No work remaining
  'STAGE_REQUEST_EXISTING_WORKER', //Already a worker of this group
  'STAGE_REQUEST_PENDING_WORK', //Work is already pending
  //Submit stage errors
  'STAGE_SUBMIT_NO_DATA', //No work data was sent to the server
  //Security errors
  'SECURITY_INVALID_KEY', //Invalid key error
  'SECURITY_KEY_GENERATION_FAILURE', //Key generation error
  'SECURITY_ENCRYPTION_FAILURE', //Encryption error
  'SECURITY_DECRYPTION_FAILURE', //Decryption error
  'SECURITY_SIGNING_FAILURE', //Signing error
  'SECURITY_VERIFICATION_FAILURE' //Signed message verification error
];
//Declare error verifying function
let verifyError = function(error, type) {
  //Make sure the string is UpperCase
  error = error.toUpperCase();
  //Verify that the error exists. If so, return the error, else return
  //"UNKNOWN_ERROR"
  return errors.indexOf(error) !== -1 ? error : errors[0];
};
//Send error helper function
module.exports.sendError = function(socket, error, disconnect) {
  //Tell the user about the error
  try {
    socket.sendError(new Error(verifyError(error)),
      function(error) {
      //If we wanted to disconnect, do so to prevent further communications
      if(disconnect) {
        socket.destroy();
      }
    });
  } catch(e) {
    //Destroy socket
    socket.destroy();
    return;
  }
};
