//Require the encryption modules
var RSA = require('simple-encryption').RSA;
var AES = require('simple-encryption').AES;
//Error handler
var Error = require('../Utils/Error.js');
//Export main function
module.exports = function(socket, serverPublicKey, callback) {
  //Generate a session key
  var sessionKey = AES.generateKey();
  //Encrypt it with the serverPublicKey
  var encrypted;
  //Attempt to encrypt, otherwise error to user
  try {
    encrypted = RSA.encrypt(serverPublicKey, JSON.stringify({key: sessionKey}));
  } catch(e) {
    console.log('Error: SECURITY_ENCRYPTION_FAILURE');
    return;
  }
  //Listen only once
  socket.once('message', function(message) {
    if(Error.findError(message.error)) {
      //Error has occured
      console.log('Error: ' + Error.findError(message.error));
      return;
    }
    var payload = message.payload;
    var tag = message.tag;
    var iv = message.iv;
    //Try to decrypt
    var decrypted;
    try {
      decrypted = JSON.parse(AES.decrypt(sessionKey, iv, tag, payload))
    } catch(e) {
      console.log('Error: SECURITY_DECRYPTION_FAILURE');
      return;
    }
    //Tag wasn't correct
    if(!decrypted) {
      console.log('Error: STAGE_HANDSHAKE_GENERIC');
      return;
    }
    //Encrypted text wasn't correct
    if(decrypted !== 'success') {
      console.log('Error: STAGE_HANDSHAKE_GENERIC');
      return;
    }
    //Callback to the caller with the sessionKey
    callback(sessionKey);
  });
  //Send a message
  try {
    socket.sendMessage({type: 'handshake', payload: encrypted});
  } catch(e) {
    //Destroy socket
    socket.destroy();
    return;
  }
}
