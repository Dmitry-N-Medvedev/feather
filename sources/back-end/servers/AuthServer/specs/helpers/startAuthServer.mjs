const re = /started\son\sport\s(\d+)$/gmiu;

export const startAuthServer = (logger = null) => new Promise((resolve, reject) => {
  if (logger === null) {
    return reject(new ReferenceError('logger is undefined'));
  }

  logger.on('data', (data) => {
    const match = re.exec(data.toString()) ?? null;

    if (match !== null) {
      resolve();
    }
  });

  return undefined;
});
