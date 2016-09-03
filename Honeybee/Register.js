'use strict';
//Require the handshake
let handshake = require('./Handshake.js');

//AES module
let AES = require('simple-encryption').AES;

//Error module
let errorHandler = require('../Utils/errorHandler.js');

//Export main function
module.exports = function(socket, eventHandler, storage, serverPublicKey,
  callback) {
  //Start handshake
  handshake(socket, serverPublicKey, function(sessionKey) {
    //Once handshake is successful, listen for another message from registering
    socket.once('message', function(message) {
      if(errorHandler.findError(message.error)) {
        //Error has occured
        console.log('Error: ' + errorHandler.findError(message.error));
        return;
      }
      //Get encryption information
      let payload = message.payload;
      let iv = message.iv;
      let tag = message.tag;
      //Try to decrypt
      let decrypted;
      try {
        decrypted = JSON.parse(AES.decrypt(sessionKey, iv, tag, payload));
      } catch(e) {
        console.log('Error: SECURITY_DECRYPTION_FAILURE');
        return;
      }
      let privateKey = decrypted.privateKey;
      storage.setItem('key', privateKey);
      storage.setItem('id', message.id);
      callback(privateKey, message.id);
    });
    //Prepare register message
    let jsonmsg = {
      register: 'register'
    };
    //Declare encrypted letiable
    let encrypted;
    //Generate IV
    let iv = AES.generateIV();
    //Try to encrypt
    try {
      encrypted = AES.encrypt(sessionKey, iv, JSON.stringify(jsonmsg));
    } catch(e) {
      console.log('Error: SECURITY_ENCRYPTION_FAILURE');
      return;
    }
    //Send registration message
    try {
      socket.sendMessage({type: 'register', payload: encrypted.encrypted,
        tag: encrypted.tag, iv: iv});
    } catch(e) {
      //Destroy socket
      socket.destroy();
      return;
    }
  });
};
