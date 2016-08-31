//Import mongoose
var mongoose = require('mongoose');

//Setup schema
var dataChunkSchema = mongoose.Schema({
  //data of the DataChunk
  data: String
});

//Export schema
module.exports = mongoose.model('DataChunk', dataChunkSchema);
