//Import encryption functions
var AES = require('simple-encryption').AES;
var RSA = require('simple-encryption').RSA;
//Import error handler
var Error = require('../../Utils/Error.js');
//Import forge
var forge = require('node-forge');

//Mongoose schemas
var Worker = require('../MongoSchemas/Worker.js');

module.exports = function(message, mongoose, socket, eventEmitter, key,
  callback) {
  //Supposed user ID
  var id = message.id;
  //Get encryption information
  var payload = message.payload;
  var iv = message.iv;
  var tag = message.tag;
  //Define encrypted variable for try/catch
  var decrypted;
  //Catch any errors during decryption
  try {
    decrypted = JSON.parse(AES.decrypt(key, iv, tag, payload));
  } catch(e) {
    //Forward error to user and disconnect
    Error.sendError(socket, 'SECURITY_DECRYPTION_FAILURE', true);
    //Prevent further execution
    return;
  }
  //Check that decryption was successful, if not disconnect user
  if(!decrypted) {
    Error.sendError(socket, 'STAGE_HANDSHAKE_POST_COMPLETE_FAILURE', true);
    //stop execution
    return;
  }
  //Signed payload
  var verify = decrypted.verify;
  //hash
  var md = decrypted.md;
  //Make sure that the required variables were actually sent
  if(!id || !verify || !md) {
    Error.sendError(socket, 'GENERIC_PARAMETERS_MISSING', true);
    //Stop further execution
    return;
  }
  //Find the ID that the user provided
  return Worker.findOne({'_id': id}, function(error, worker) {
    //If error, tell the user and cut the session (something bad has happened)
    if(error) {
      Error.sendError(socket, 'DATABASE_GENERIC', true);
      return;
    }
    //If no worker was found
    if(!worker) {
      Error.sendError(socket, 'DATABASE_NOT_FOUND', true);
      return;
    }
    //Get the public key for the worker
    var publicKey = worker.publicKey;
    //Declare verified variable for try/catch
    var verified;
    //Verify that the worker is who they say they are. If verification fails
    //pass the error to the user
    try {
      verified = RSA.verify(publicKey, verify, md);
    } catch(e) {
      Error.sendError(socket, 'SECURITY_VERIFICATION_FAILURE', true);
      //Stop execution
      return;
    }
    //Generate IV for encryption
    var newIV = AES.generateIV();
    //Create message for encryption
    var jsonmsg = {
      'verified': verified
    };
    //Declare message variable for try/catch
    var message;
    //Encrypt message, passing errors to user
    try {
      message = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
    } catch(e) {
      Error.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
      //Stop execution
      return;
    }
    //Send to the user the status of if they are verified or not
    try {
      socket.sendMessage({'payload': message.encrypted,
        'tag': message.tag, 'iv': iv});
    } catch(e) {
      //Destroy socket
      socket.destroy();
      return;
    }
    //Return to the callback
    return callback(verified);
  });
};
