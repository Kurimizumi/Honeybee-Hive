'use strict';
//Import verification module
let verify = require('./Verify.js');
//Import AES module
let AES = require('simple-encryption').AES;
//Import error handler
let errorHandler = require('../Utils/errorHandler.js');
module.exports = function(socket, eventHandler, serverPublicKey,
  clientPrivateKey, clientID, data, callback) {
  verify(socket, eventHandler, serverPublicKey, clientPrivateKey, clientID,
    function(verified, sessionKey) {
    //If we're not verified
    if(verified == null) {
      console.log('Error: SECURITY_VERIFICATION_FAILURE');
      return;
    }
    //Receive status
    socket.once('message', function(message) {
      //If we get an error
      if(errorHandler.findError(message.error)) {
        console.log('Error: ' + errorHandler.findError(message.error));
        return;
      }
      //Get encryption information
      let payload = message.payload;
      let tag = message.tag;
      let iv = message.iv;
      //Try to decrypt
      let decrypted;
      try {
        decrypted = JSON.parse(AES.decrypt(sessionKey, iv, tag, payload));
      } catch(e) {
        console.log('Error: SECURITY_DECRYPTION_FAILURE');
        return;
      }
      //If authentication failed
      if(decrypted == null) {
        console.log('Error: STAGE_HANDSHAKE_POST_COMPLETE_FAILURE');
        return;
      }
      callback(decrypted.success);
    });
    //Prepare message for sending
    let jsonmsg = {
      data: data
    };
    //Generate IV
    let iv = AES.generateIV();
    //Try to encrypt
    let encrypted;
    try {
      encrypted = AES.encrypt(sessionKey, iv, JSON.stringify(jsonmsg));
    } catch(e) {
      console.log('Error: SECURITY_ENCRYPTION_FAILURE');
      return;
    }
    try {
      socket.sendMessage({type: 'submit', payload: encrypted.encrypted,
        tag: encrypted.tag, iv: iv});
    } catch(e) {
      //Destroy socket
      socket.destroy();
      return;
    }
  });
};
