export const stopAuthServer = (handle = null, logger = null) => new Promise((resolve, reject) => {
  if (handle === null) {
    reject(new ReferenceError('handle is undefined'));
  }

  if (logger === null) {
    reject(new ReferenceError('logger is undefined'));
  }

  logger.on('data', (data) => {
    console.debug(data.toString());
    // const match = re.exec(data.toString()) ?? null;

    // if (match !== null) {
    //   resolve();
    // }
    resolve();
  });

  handle.cancel();
});
