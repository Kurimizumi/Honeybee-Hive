'use strict';
//Import verification module
let verify = require('./Verify.js');
//Import AES module
let AES = require('simple-encryption').AES;
//Import error handler
let errorHandler = require('../error/errorHandler.js');
let errorList = require('../error/errorList.js');
module.exports = function(socket, eventHandler, serverPublicKey,
  clientPrivateKey, clientID, data, callback) {
  verify(socket, eventHandler, serverPublicKey, clientPrivateKey, clientID,
    function(error, verified, sessionKey) {
    //If we get an error, pass it on
    if(error) {
      return callback(error);
    }
    //If we're not verified
    if(verified == null) {
      return callback(new errorList.SecurityVerificationFailure());
    }
    //Receive status
    socket.once('message', function(message) {
      //If we get an error
      if(message.error) {
        return callback(errorHandler.createError(message.errror));
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
      if(decrypted == null) {
        return callback(new errorList.HandshakePostCompleteFailure());
      }
      callback(null, decrypted.success);
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
      return callback(new errorList.SecurityEncryptionFailure());
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
