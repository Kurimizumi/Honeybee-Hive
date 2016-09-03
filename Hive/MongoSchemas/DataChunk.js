'use strict';
//Import mongoose
let mongoose = require('mongoose');

//Setup schema
let dataChunkSchema = mongoose.Schema({
  //data of the DataChunk
  data: String
});

//Export schema
module.exports = mongoose.model('DataChunk', dataChunkSchema);
