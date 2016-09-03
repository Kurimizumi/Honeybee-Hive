//Require the encryption modules
const RSA = require('simple-encryption').RSA;
const AES = require('simple-encryption').AES;
//Error handler
const error = require('../Utils/errorHandler.js');
//Export main function
module.exports = function(socket, serverPublicKey, callback) {
  //Generate a session key
  const sessionKey = AES.generateKey();
  //Encrypt it with the serverPublicKey
  let encrypted;
  //Attempt to encrypt, otherwise error to user
  try {
    encrypted = RSA.encrypt(serverPublicKey, JSON.stringify({key: sessionKey}));
  } catch(e) {
    console.log('Error: SECURITY_ENCRYPTION_FAILURE');
    return;
  }
  //Listen only once
  socket.once('message', function(message) {
    if(error.findError(message.error)) {
      //Error has occured
      console.log('Error: ' + error.findError(message.error));
      return;
    }
    const payload = message.payload;
    const tag = message.tag;
    const iv = message.iv;
    //Try to decrypt
    let decrypted;
    try {
      decrypted = JSON.parse(AES.decrypt(sessionKey, iv, tag, payload));
    } catch(e) {
      console.log('Error: SECURITY_DECRYPTION_FAILURE');
      return;
    }
    //Tag wasn't correct
    if(decrypted == null) {
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
};
