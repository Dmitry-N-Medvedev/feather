export const ActionTypes = Object.freeze({
  READ: 0x01, // read - GET a file
  WRITE: 0x02, // write - POST, PUT, PATCH a file.
  EXECUTE: 0x04, // execute - call a server-side function which does not involve changing a file, or list a directory
});
