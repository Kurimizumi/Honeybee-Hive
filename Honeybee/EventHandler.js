'use strict';
//Import events
const events = require('events');

//Create EventHandler function
class EventHandler extends events.EventEmitter {
  constructor() {
    super();
  }
  
  registered() {
    this.emit('registered');
  }
  
  request(callback) {
    this.emit('request', callback);
  }
  
  submit(data, callback) {
    this.emit('submit', data, callback);
  }
}

module.exports = EventHandler;
