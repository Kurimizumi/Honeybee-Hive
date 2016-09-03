'use strict';
//Import verification module
let verify = require('./Verify.js');
//Import AES module
let AES = require('simple-encryption').AES;
//Import error module
let errorHandler = require('../Utils/errorHandler.js');
module.exports = function(socket, eventHandler, serverPublicKey,
  clientPrivateKey, clientID, callback) {
  verify(socket, eventHandler, serverPublicKey, clientPrivateKey, clientID,
    function(verified, sessionKey) {
    //If we're not verified
    if(!verified) {
      console.log('Error: SECURITY_VERIFICATION_FAILURE');
      return;
    }
    //Receive work
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
      if(!decrypted) {
        console.log('Error: STAGE_HANDSHAKE_POST_COMPLETE_FAILURE');
        return;
      }
      //I'm not sure why, but apparently we need to parse it again for it not
      //to break
      //when receiving a current workgroup
      let work = decrypted.work;
      callback(work);
    });
    //Prepare message for sending
    let jsonmsg = {
      request: 'request'
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
      socket.sendMessage({type: 'request', payload: encrypted.encrypted,
        tag: encrypted.tag, iv: iv});
    } catch(e) {
      //Destroy socket
      socket.destroy();
      return;
    }
  });
};
