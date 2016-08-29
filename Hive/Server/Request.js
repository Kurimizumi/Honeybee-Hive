//Import error handler
var Error = require('../../Utils/Error.js');
//Import AES library
var AES = require('../../Utils/AES.js');

//Schema imports
var Worker = require('../MongoSchemas/Worker.js');
var WorkGroup = require('../MongoSchemas/WorkGroup.js');

var checkForSubmittedData = function(array, userID) {
  //Loop through the workgroup array
  for(var i = 0; i < array.length; i++) {
    //Create a flag variable
    var flag = true;
    //Loop through the data in the workgroup array
    for(var j = 0; j < array[i].data.length; j++) {
      //If the current worker is not equal to
      if(array[j].worker == userID) {
        flag = false;
      }
    }
    //Only if the worker wasn't found in the array
    if(flag) {
      return false;
    }
  }
  return true;
}

//Export the request handler
module.exports = function(message, mongoose, socket, eventEmitter, key, userID, groupMax){
  //Get encryption information
  var payload = message.payload;
  var tag = message.tag;
  var iv = message.iv;
  //Declare decrypted variable for try/catch
  var decrypted;
  //Try decrypting, otherwise pass error onto user
  try {
    decrypted = JSON.parse(AES.decrypt(key, iv, tag, payload));
  } catch(e) {
    Error.sendError(socket, 'SECURITY_DECRYPTION_FAILURE', true);
    return;
  }
  if(!decrypted ||
    !decrypted.request ||
    decrypted.request.toUpperCase() !== 'REQUEST') {
      //Stop execution, we cannot verify the user...
      Error.sendError(socket, 'STAGE_HANDSHAKE_POST_COMPLETE_FAILURE', true);
      return;
  }
  //Make sure that the user does not currently have a work group that they have
  //not submitted work to
  WorkGroup.find({workers: userID}, function(error, workgroups) {
    //Pass database errors onto client
    if(error) {
      Error.sendError(socket, 'DATABASE_GENERIC', true);
      //Stop execution
      return;
    }
    //If the user has no pending work
    if(workgroups.length == 0 || checkForSubmittedData(workgroups, userID)) {
      //Set the user's lastActiveTime to now
      Worker.findOne({_id: userID}, function(error, worker) {
        //If error, tell the user and stop executing
        if(error) {
          Error.sendError(socket, 'DATABASE_GENERIC', true);
          //Stop execution
          return;
        }
        //Set the lastActiveTime to now
        worker.lastActive = new Date();
        worker.save(function(error) {
          //If error, tell the user and stop executing
          if(error) {
            Error.sendError(socket, 'DATABASE_GENERIC', true);
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
                Error.sendError(socket, 'DATABASE_GENERIC', true);
                //Stop execution
                return;
              }
              //If there are no non full work groups, create a new work group
              if(!workgroup) {
                //Emit a create_work event and pass in a callback with a work
                //argument
                eventEmitter.emit('create_work', function(work) {
                  //If there's no work left
                  if(!work) {
                    Error.sendError(socket, 'STAGE_REQUEST_NO_WORK', true);
                    //Stop execution
                    return;
                  }
                  //Create and populate the new group
                  var newworkgroup = new WorkGroup();
                  newworkgroup.workers = [userID];
                  newworkgroup.data = [];
                  newworkgroup.work = JSON.stringify(work);
                  newworkgroup.save(function(error) {
                    //If database error, pass it onto the user
                    if(error) {
                      Error.sendError(socket, 'DATABASE_GENERIC', true);
                      //Stop execution
                      return;
                    }
                    //Prepare message for encryption
                    var jsonmsg = {
                      work: work
                    }
                    //Generate IV
                    var iv = AES.generateIV();
                    //Declare encrypted variable for try/catch
                    var encrypted;
                    //Try to encrypt, forward errors
                    try {
                      encrypted = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
                    } catch(e) {
                      Error.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
                      //Stop execution
                      return;
                    }
                    //Send work to client
                    try {
                      socket.sendMessage({'payload': encrypted[0], 'tag': encrypted[1],
                        'iv': encrypted[2]});
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
                    Error.sendError(socket, 'DATABASE_GENERIC', true);
                    //stop execution
                    return;
                  }
                  //Prepare message for encryption
                  var jsonmsg = {
                    work: workgroup.work
                  }
                  //Generate IV
                  var iv = AES.generateIV();
                  //Declare encrypted variable for try/catch block
                  var encrypted;
                  //Attempt to encrypt, pass errors to user
                  try {
                    encrypted = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
                  } catch(e) {
                    Error.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
                    //Stop execution
                    return;
                  }
                  try {
                    socket.sendMessage({'payload': encrypted[0], 'tag': encrypted[1], 'iv': encrypted[2]});
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
      Error.sendError(socket, 'STAGE_REQUEST_PENDING_WORK', true);
      //Stop execution/return for consistency
      return;
    }
  });
}
