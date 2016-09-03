'use strict';
//Import encryption utils
let RSA = require('simple-encryption').RSA;
let AES = require('simple-encryption').AES;
//Error handler
let errorHandler = require('../Utils/errorHandler.js');
//handshake
let handshake = require('./Handshake.js');
//Export main function
module.exports = function(socket, eventHandler, serverPublicKey,
  clientPrivateKey, clientID, callback) {
    handshake(socket, serverPublicKey, function(sessionKey) {
    //Once handshake has been completed, listen to verification messages
    socket.once('message', function(message) {
      if(errorHandler.findError(message.error)) {
        //An error has occured
        console.log('Error: ' + errorHandler.findError(message.error));
        return;
      }
      //Encryption information
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
      callback(decrypted.verified, sessionKey);
    });
    //Prepare verification section
    let signed, md;
    //Try to sign message
    try {
      let out = RSA.sign(clientPrivateKey, 'verify');
      signed = out.signed;
      md = out.md;
    } catch(e) {
      console.log('Error: SECURITY_SIGNING_FAILURE');
      return;
    }
    //Prepare json message for aes encryption
    let jsonmsg = {
      verify: signed,
      md: md
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
    //Send message to server
    try {
      socket.sendMessage({type: 'verify', id: clientID,
        payload: encrypted.encrypted, tag: encrypted.tag, iv: iv});
    } catch(e) {
      //Destroy socket
      socket.destroy();
      return;
    }
  });
};
