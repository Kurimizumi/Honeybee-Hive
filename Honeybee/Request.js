//Import verification module
var verify = require('./Verify.js');
//Import AES module
var AES = require('simple-encryption').AES;
//Import error module
var Error = require('../Utils/Error.js');
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
        if(Error.findError(message.error)) {
          console.log('Error: ' + Error.findError(message.error));
          return;
        }
        //Get encryption information
        var payload = message.payload
        var tag = message.tag;
        var iv = message.iv;
        //Try to decrypt
        var decrypted;
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
        //I'm not sure why, but apparently we need to parse it again for it not to break
        //when receiving a current workgroup
        var work = decrypted.work;
        callback(work);
      });
      //Prepare message for sending
      var jsonmsg = {
        request: 'request'
      }
      //Generate IV
      var iv = AES.generateIV();
      //Try to encrypt
      var encrypted;
      try {
        encrypted = AES.encrypt(sessionKey, iv, JSON.stringify(jsonmsg));
      } catch(e) {
        console.log('Error: SECURITY_ENCRYPTION_FAILURE');
        return;
      }
      try {
        socket.sendMessage({type: 'request', payload: encrypted.encrypted, tag: encrypted.tag, iv: iv});
      } catch(e) {
        //Destroy socket
        socket.destroy();
        return;
      }
    });
}
