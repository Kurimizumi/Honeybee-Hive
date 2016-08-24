//Import forge for encryption
var forge = require('node-forge');
//Import our error handling module
var Error = require('../../Utils/Error.js');
//Import our encryption modules
var RSA = require('../../Utils/RSA.js');
var AES = require('../../Utils/AES.js');
//Should return an AES key
module.exports = function(message, socket, eventEmitter, key) {
  //If the encrypted payload is not present, fail
  if(!message.payload) {
    //Send an error, and disconnect
    Error.sendError(socket, 'GENERIC_PAYLOAD_MISSING', true);
    //Return to prevent further execution
    return;
  }
  //Declare decrypted variable for try/catch
  var decrypted;
  //Attempt to decrypt the payload
  try {
    decrypted = JSON.parse(RSA.decrypt(key, message.payload));
  } catch (e) {
    //If an error was thrown stop
    Error.sendError(socket, 'SECURITY_DECRYPTION_FAILURE', true);
    //Return to prevent further execution
    return;
  }
  //Check if key exists in JSON
  if(!decrypted.key) {
    //Tell user that the key wasn't found
    Error.sendError(socket, 'STAGE_HANDSHAKE_KEY_MISSING', true);
    //Return to prevent further execution
    return;
  }
  //Check if key is in correct format
  if(typeof decrypted.key != 'string' ||
    decrypted.key.length != 32
  ) {
    //Not a string or not 256 bits, so fail
    Error.sendError(socket, 'SECURITY_INVALID_KEY', true);
    //Return to prevent further execution
    return;
  }
  //Generate a 12 byte IV for AES-GCM
  var iv = AES.generateIV();
  //Declare encrypted variable for try/catch
  var encrypted;
  try {
    encrypted = AES.encrypt(decrypted.key, iv, JSON.stringify('success'));
  } catch (e) {
    Error.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
    //Stop execution
    return;
  }
  //Send message to user
  socket.sendMessage({'payload': encrypted[0], 'tag': encrypted[1], 'iv': encrypted[2]});
  //Return the key to the connection handler
  return decrypted.key;
}
