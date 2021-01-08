export const ActionTypes = Object.freeze({
  READ: 0x01, // read - GET a file
  WRITE: 0x02, // write - not used. Should be used to change a file on the server.
  EXECUTE: 0x04, // execute - POST results
});
