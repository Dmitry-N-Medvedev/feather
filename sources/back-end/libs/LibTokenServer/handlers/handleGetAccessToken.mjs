import {
  // eslint-disable-next-line no-unused-vars
  readJson,
} from '../helpers/readJson.mjs';

const OK_STATUS = '200 OK';

export const handleGetAccessToken = async (res, req, libTokenFactory, debuglog) => {
  res.onAborted(() => {
    res.aborted = true;
  });

  res.aborted = false;

  const accountToken = req.getHeader('authorization') ?? null;
  const request = await readJson(res, req, debuglog);

  if (res.aborted === false) {
    res.writeStatus(OK_STATUS).end(JSON.stringify({
      token: (await libTokenFactory.issueAccessToken(request.action, accountToken, request.location)),
    }));
  }
};
