'use strict';
//Import mongoose, the display manager
const mongoose = require('mongoose');
//Create a worker schema for storing clients
const workGroupSchema = mongoose.Schema({
  //Array of objects containing data from each client
  data: [{
    worker: String, //Worker ID
    data: String //Data given by client
  }],
  workers: [String], //List of worker IDs
  work: String //The work set
});

//Export the schema for use
module.exports = mongoose.model('WorkGroup', workGroupSchema);
