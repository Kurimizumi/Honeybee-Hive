'use strict';
//Import events
const events = require('events');

//Create EventHandler class
class EventHandler extends events.EventEmitter {
  constructor () {
    //We want the default EventEmitter constructor
    super();
  }
  //Create work event
  //callback is what gets called with the data
  createWork (callback) {
    this.emit('create_work', callback);
  }
  //Workgroup complete event
  //Array is the array of data that has been submitted
  completeWorkGroup (array, callback) {
    this.emit('workgroup_complete', array, callback);
  }
  //New datachunk event
  //data is the verified data
  createDataChunk (data) {
    this.emit('new_datachunk');
  }
  //Request to stop the server
  stop () {
    this.emit('stop');
  }
}

module.exports = EventHandler;
