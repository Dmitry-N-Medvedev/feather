const OK_STATUS = '200 OK';

export const handleGetAccountToken = async (res, libTokenFactory, debuglog) => {
  res.onAborted(() => {
    res.aborted = true;
  });

  res.aborted = false;

  if (res.aborted === false) {
    const result = JSON.stringify({
      token: (await libTokenFactory.issueAccountToken()),
    });

    debuglog(result);

    res.writeStatus(OK_STATUS).end(result);
  }
};
