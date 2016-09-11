'use strict';
//Require the handshake
let handshake = require('./Handshake.js');

//AES module
let AES = require('simple-encryption').AES;

//Error module
let errorHandler = require('../error/errorHandler.js');
let errorList = require('../error/errorList.js');

//Import hashcash
const hashcashgen = require('hashcashgen');

//Export main function
module.exports = function(socket, eventHandler, storage, serverPublicKey,
  strength, callback) {
  //Start handshake
  handshake(socket, serverPublicKey, function(error, challenge, sessionKey) {
    //Check for errors
    if(error) {
      //If so, callback to the user with the error
      return callback(error);
    }
    //Once handshake is successful, listen for another message from registering
    socket.once('message', function(message) {
      if(message.error) {
        //Error has occured
        return callback(errorHandler.createError(error));
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
        return callback(new errorList.SecurityDecryptionFailure());
      }
      let privateKey = decrypted.privateKey;
      storage.setItem('key', privateKey);
      storage.setItem('id', message.id);
      callback(null, privateKey, message.id);
    });
    //Generate hashcash
    const hashcash = hashcashgen(challenge, strength);
    console.log(hashcash);
    //Declare encrypted letiable
    let encrypted;
    //Generate IV
    let iv = AES.generateIV();
    //Try to encrypt
    try {
      encrypted = AES.encrypt(sessionKey, iv, JSON.stringify(hashcash));
    } catch(e) {
      return callback(new errorList.SecurityEncryptionFailure());
    }
    //Send registration message
    try {
      socket.sendMessage({type: 'register', payload: encrypted.encrypted,
        tag: encrypted.tag, iv: iv});
    } catch(e) {
      //Destroy socket for something has gone wrong and we want to be sure
      socket.destroy();
      return;
    }
  });
};
