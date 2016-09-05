'use strict';
//Import error handler
const errorHandler = require('../../error/errorHandler.js');
const errorList = require('../../error/errorList.js');
//Import AES library
const AES = require('simple-encryption').AES;

//Schema imports
const Worker = require('../MongoSchemas/Worker.js');
const WorkGroup = require('../MongoSchemas/WorkGroup.js');

//Export the request handler
module.exports = function(message, mongoose, socket, eventEmitter, key, userID,
  groupMax) {
  //Get encryption information
  const payload = message.payload;
  const tag = message.tag;
  const iv = message.iv;
  //Declare decrypted letiable for try/catch
  let decrypted;
  //Try decrypting, otherwise pass error onto user
  try {
    decrypted = JSON.parse(AES.decrypt(key, iv, tag, payload));
  } catch(e) {
    errorHandler.sendError(socket,
      new errorList.SecurityDecryptionFailure(),
      true);
    return;
  }
  if(decrypted == null ||
    decrypted.request == null ||
    decrypted.request.toUpperCase() !== 'REQUEST') {
      //Stop execution, we cannot verify the user...
      errorHandler.sendError(socket,
        new errorList.HandshakePostCompleteFailure(),
        true);
      return;
  }
  //Make sure that the user does not currently have a work group that they have
  //not submitted work to
  WorkGroup.find({
    //All conditions should be true
    $and: [
      //And in the workers section of the work group
      {'workers': userID},
      //Only workgroups which the worker has not submitted data for
      {
        //In the data array
        data: {
          //Not equal to elemMatch (i.e where data hasn't been submitted)
          $not: {
            //Match all documents with the the worker in the submitted work
            //object array equal to the worker ID
            $elemMatch: {
              worker: userID
            }
          }
        }
      }
    ]
  }, function(error, workgroups) {
    //Pass database errors onto client
    if(error) {
      errorHandler.sendError(socket,
        new errorList.DatabaseGeneric(),
        true);
      //Stop execution
      return;
    }
    //If the user has no pending work
    if(workgroups.length === 0) {
      //Set the user's lastActiveTime to now
      Worker.findOne({_id: userID}, function(error, worker) {
        //If error, tell the user and stop executing
        if(error) {
          errorHandler.sendError(socket,
            new errorList.DatabaseGeneric(),
            true);
          //Stop execution
          return;
        }
        //Set the lastActiveTime to now
        worker.lastActive = new Date();
        worker.save(function(error) {
          //If error, tell the user and stop executing
          if(error) {
            errorHandler.sendError(socket,
              new errorList.DatabaseGeneric(),
              true);
            return;
          }
          //Find non full work groups
          WorkGroup.findOne(
            {
              //All conditions should be true
              $and: [
                //Only workgroups which are not full
                {['workers.' + groupMax]: {$exists: false}},
                //And not in the workers section of the work group
                {'workers': {$ne: userID}}
              ]
            },
            function(error, workgroup) {
              //Pass database errors onto the client
              if(error) {
                errorHandler.sendError(socket,
                  new errorList.DatabaseGeneric(),
                  true);
                //Stop execution
                return;
              }
              //If there are no non full work groups, create a new work group
              if(workgroup == null) {
                //Emit a create_work event and pass in a callback with a work
                //argument
                eventEmitter.emit('create_work', function(work) {
                  //If there's no work left
                  if(work == null) {
                    errorHandler.sendError(socket,
                      new errorList.RequestNoWork(),
                      true);
                    //Stop execution
                    return;
                  }
                  //Create and populate the new group
                  const newworkgroup = new WorkGroup();
                  newworkgroup.workers = [userID];
                  newworkgroup.data = [];
                  newworkgroup.work = JSON.stringify(work);
                  newworkgroup.save(function(error) {
                    //If database error, pass it onto the user
                    if(error) {
                      errorHandler.sendError(socket,
                        new errorList.DatabaseError(),
                        true);
                      //Stop execution
                      return;
                    }
                    //Prepare message for encryption
                    let jsonmsg = {
                      work: work
                    };
                    //Generate IV
                    const iv = AES.generateIV();
                    //Declare encrypted letiable for try/catch
                    let encrypted;
                    //Try to encrypt, forward errors
                    try {
                      encrypted = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
                    } catch(e) {
                      errorHandler.sendError(socket,
                        new errorList.SecurityEncryptionFailure(),
                        true);
                      //Stop execution
                      return;
                    }
                    //Send work to client
                    try {
                      socket.sendMessage({'payload': encrypted.encrypted,
                        'tag': encrypted.tag, 'iv': iv});
                    } catch(e) {
                      //Destroy socket
                      socket.destroy();
                      return;
                    }
                  });
                });
              } else {
                //A valid work group has been found, add the new worker
                workgroup.workers.push(userID);
                //Save immediately, so it updates for other clients
                workgroup.save(function(error) {
                  //Pass database errors to user
                  if(error) {
                    errorHandler.sendError(socket,
                      new errorList.DatabaseGeneric(),
                      true);
                    //stop execution
                    return;
                  }
                  //Prepare message for encryption
                  let jsonmsg = {
                    work: JSON.parse(workgroup.work)
                  };
                  //Generate IV
                  const iv = AES.generateIV();
                  //Declare encrypted letiable for try/catch block
                  let encrypted;
                  //Attempt to encrypt, pass errors to user
                  try {
                    encrypted = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
                  } catch(e) {
                    errorHandler.sendError(socket,
                      new errorList.SecurityEncryptionFailure(), true);
                    //Stop execution
                    return;
                  }
                  try {
                    socket.sendMessage({'payload': encrypted.encrypted,
                      'tag': encrypted.tag, 'iv': iv});
                  } catch(e) {
                    //Destroy socket
                    socket.destroy();
                    return;
                  }
                });
              }
            }
          );
        });
      });
    } else {
      //Pending work
      errorHandler.sendError(socket,
        new errorList.RequestPendingWork(), true);
      //Stop execution/return for consistency
      return;
    }
  });
};
