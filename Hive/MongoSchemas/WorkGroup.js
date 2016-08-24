//Import mongoose, the display manager
var mongoose = require("mongoose");
//Create a worker schema for storing clients
var workGroupSchema = mongoose.schema({
  //Array of objects containing data from each client
  data: [{
    worker: String, //Worker ID
    data: String //Data given by client
  }],
  workers: [String], //List of worker IDs
  work: String //The work set
});

//Export the schema for use
module.exports = mongoose.model("WorkGroup", workGroupSchema);
