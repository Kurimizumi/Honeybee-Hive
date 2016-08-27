/*
1. Check the user is a worker for this group
2. Check the user hasn't already submitted work for it
3. Add work
4a. Check if the workgroup is done
4b. [DELETED]
4c. If so, emit an event with the data
4d. Process the data
4e. Receive if work group was valid. If not, remove all workers
4f. If so, create a DataChunk with the final data from that work group
4g. Delete the work group
4h. Emit another event with the DataChunk data for realtime processing
*/

//Import error handler
var Error = require('../../Utils/Error.js');
//Import AES for encryption
var AES = require('../../Utils/AES.js');

//Mongo schemas
var WorkGroup = require('../MongoSchemas/WorkGroup.js');
var DataChunk = require('../MongoSchemas/DataChunk.js');

//Export main submit function
module.exports = function(message, mongoose, socket, eventEmitter, key, userID, groupMax){
  //Get encryption information
  var payload = message.payload;
  var tag = message.tag;
  var iv = message.iv;
  //Declare decrypted variable for decryption attempt
  var decrypted
  //Try to decrypt, pass errors onto user
  try {
    decrypted = JSON.parse(AES.decrypt(key, iv, tag, payload));
  } catch (e) {
    Error.sendError(socket, 'SECURITY_DECRYPTION_FAILURE', true);
    //Stop execution
    return;
  }
  //Check that the user is verified still, if not disconnect them
  if(!decrypted) {
    Error.error(socket, 'STAGE_HANDSHAKE_POST_COMPLETE_FAILURE', true);
    //Stop execution
    return;
  }
  //Store decrypted json in required locations
  var data = decrypted.data;
  //If no data was sent, error
  if(!data) {
    Error.error(socket, 'STAGE_SUBMIT_NO_DATA', true);
    //Stop execution
    return;
  }
  WorkGroup.findOne(
    {
      //All conditions should be true
      $and: [
        //Not in the workers section of the work group
        {'workers': userID},
        //Only ones which do not contain worker as having submitted data
        {'data': {$not: {$elemMatch: {worker: userID}}}}
      ]
    }, function(error, workgroup) {
      //If an error occured, pass it to the user and disconnect
      if(error) {
        Error.sendError(socket, 'DATABASE_GENERIC', true);
        //Stop execution
        return;
      }
      //If no work group was found, error to the user
      if(!workgroup) {
        Error.error(socket, 'DATABASE_NOT_FOUND', true);
        //Stop execution
        return;
      }
      //Push the new data to the work group
      workgroup.data.push({
        worker: userID,
        data: JSON.stringify(data)
      });
      //Save the new data
      workgroup.save(function(error) {
        //If error, pass to user
        if(error) {
          Error.error(socket, 'DATABASE_GENERIC', true);
          //Stop execution
          return;
        }
        //Otherwise alert the user about the success
        var jsonmsg = {
          success: true
        };
        //Generate an IV
        var iv = AES.generateIV();
        //Declare encrypted for try/catch
        var encrypted;
        //Try to encrypt
        try {
          encrypted = AES.encrypt(key, iv, JSON.stringify(jsonmsg));
        } catch (e) {
          //Tell the user about the error and halt
          Error.sendError(socket, 'SECURITY_ENCRYPTION_FAILURE', true);
          //Stop execution
          return;
        }
        socket.sendMessage({'payload': encrypted[0], 'tag': encrypted[1], 'iv': encrypted[2]});
        //Check if the work group has finished
        if(workgroup.data.length === workgroup.workers.length) {
          //Prepare array of data
          var array = [];
          //Loop through entire data array
          for(var i = 0; i < workgroup.data.length; i++) {
            //Strip entire array of data of worker ids, leaving only the data.
            //Also parse the data back into javascript from JSON
            array.push(JSON.parse(workgroup.data[i].data));
          }
          //Emit an event with the workdata
          eventEmitter.emit('workgroup_complete', array, function(datachunk) {
            if(!datachunk) {
              //If not valid, clear the work group for it to be repopulated to
              //try again
              workgroup.workers = [];
              workgroup.data = [];
              workgroup.save(function(error) {
                //No need to do anything here?
                return;
              });
            } else {
              //Valid work, delete the workgroup and create a datachunk from the
              //output
              WorkGroup.remove({'_id': workgroup._id}, function(error) {
                var newdatachunk = new DataChunk();
                //Stringify the datachunk and store it
                newdatachunk.data = JSON.stringify(datachunk);
                //Save our new datachunk
                newdatachunk.save(function(error) {
                  //Emit the final event telling the server that there's data
                  //to process
                  eventEmitter.emit('new_datachunk', JSON.parse(newdatachunk.data));
                });
              });
            }
          });
        }
      });
    });
  }
