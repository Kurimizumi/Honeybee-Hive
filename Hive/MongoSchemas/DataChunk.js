'use strict';
//Import mongoose
const mongoose = require('mongoose');

//Setup schema
const dataChunkSchema = mongoose.Schema({
  //data of the DataChunk
  data: String
});

//Export schema
module.exports = mongoose.model('DataChunk', dataChunkSchema);
