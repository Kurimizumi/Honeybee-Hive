//Export the class
module.exports = class ExtendableError extends Error {
  //Constructor method
  constructor(message) {
    //Call Error's constructor
    super(message);
    //Set the name to the class name
    this.name = this.constructor.name;
    //Set the message to message
    this.message = message;
    //Use captureStackTrace if available
    if (typeof Error.captureStackTrace === 'function') {
      //Add the error message to the stack trace using captureStackTrace
      Error.captureStackTrace(this, this.constructor);
    } else {
      //Add the error message to the stack trace by assignment
      this.stack = (new Error(message)).stack;
    }
  }
};
