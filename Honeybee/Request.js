'use strict';
//Import verification module
const verify = require('./Verify.js');
//Import AES module
const AES = require('simple-encryption').AES;
//Import error module
const errorHandler = require('../error/errorHandler.js');
const errorList = require('../error/errorList.js');
module.exports = function(socket, eventHandler, serverPublicKey,
  clientPrivateKey, clientID, callback) {
  verify(socket, eventHandler, serverPublicKey, clientPrivateKey, clientID,
    function(error, verified, sessionKey) {
    //If we're passed an error
    if(error) {
      //Pass it on
      return callback(error);
    }
    //If we're not verified
    if(!verified) {
      return callback(new errorList.SecurityEncryptionFailure());
    }
    //Receive work
    socket.once('message', function(message) {
      //If we get an error
      if(message.error) {
        //pass it on
        return callback(errorHandler.createError(message.error));
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
        return callback(new errorList.SecurityDecryptionFailure());
      }
      //If authentication failed
      if(!decrypted) {
        return callback(new errorList.HandshakePostCompleteFailure());
      }
      callback(null, decrypted.work);
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
      return callback(new errorList.SecurityEncryptionFailure());
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
