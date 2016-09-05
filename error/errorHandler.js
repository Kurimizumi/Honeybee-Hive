'use strict';
//Import our errorList object
const errorList = require('./errorList.js');
//Import our errorGroups object
const errorGroups = require('./errorGroups.js');
module.exports.sendError = function(socket, error, disconnect) {
  //Tell the user about the error
  try {
    socket.sendMessage({
      //Convert error to JSON
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }, function(error) {
      //If we wanted to disconnect after
      if(disconnect) {
        socket.destroy();
      }
    });
  } catch (e) {
    //If we wanted to disconnect even though we failed to notify the user
    if(disconnect) {
      socket.destroy();
    }
  }
};

module.exports.createError = function(error) {
  //Declare err variable in order to create the error later
  let err;
  //If the error name is found in our list of errors
  if(errorList[error.name] !== undefined) {
    err = new errorList[error.name]();
  }
  //Otherwise it's just an unknown generic Error
  else {
    err = new Error();
  }
  //Set the message and the stack trace to the original error
  err.message = error.message;
  err.stack = error.stack;
  //Return the error
  return err;
};
