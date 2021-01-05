# ARCHITECTURE

## WHAT TO BE DONE

You will design and implement an API that recommends an insurance policy based on a questionnaire answers.

The API is going to be used by one or more frontend apps. It should be possible to:

1. Create a user account.
    - The response must have an authentication token. We recommend to use [JWT](https://jwt.io/).
2. Submit questionnaire data.
    - The request must carry an authentication token.
    - The request should contain a JSON with all the answers.
    - The answers must be validated. Up to you to decide which validations are necessary.
3. Request recommended insurances.

We won't be judging on the quality of the recommendations, just make sure that it is consistent and corresponds to our offering at [https://feather-insurance.com/](https://feather-insurance.com/).

### QUESTIONNAIRE

- First name
- Address
- If they have any children (boolean)
  - If yes - How many do they have?
- Their occupation
  - Employed
  - Student
  - Self-employed
- Email address

### RESPONSE CODES AND ERRORS

A successful response will have either `200` or `201` status code. A response containing an error will be either `422`, `401` or `500`.

The `422` response should have human readable validation errors.

## HOW IT IS DONE

### TERMINOLOGY

- `System` - a software system capable of recommending insurance options for `Users`.
- `User` - (hopefully) a human being who wishes to get recommendations from the `System`.
- `Client` - is a web application that the `User` uses to interact with the `System`.
- Tokens
  - `AccountToken` - a token that uniquely identifies a specific `User`/`Client` combination
  - `AccessToken` - a token representing a specific grant for a specific `User`/`Client`. An AccessToken can be of one of the following types:
    - `GetQuestionnaire` type allows a `Client` to request a description of a questionnaire from the `System`
    - `PostQuestionnaire` type allows a `Client` to transmit the filled out questionnaire to the `System`

### NOTES ON TOKEN FORMAT

All token types are [Google Macaroons](https://research.google/pubs/pub41892/). The [macaroons.js](https://github.com/nitram509/macaroons.js) library is used to leverage this functionality.

Learn why [JWT is bad](https://latacora.micro.blog/a-childs-garden/) and other nice security related stuff.

#### AccountToken

First party caveats:

```javascript
account: 00000000000000000000000000000000, // represents the User Id; 256 bits; see randombytes_buf: https://libsodium.gitbook.io/doc/generating_random_data
```

#### AccessToken

First party caveats:

```javascript
account: 00000000000000000000000000000000, // represents the User Id; 256 bits; see randombytes_buf: https://libsodium.gitbook.io/doc/generating_random_data
```

```javascript
acl: 0, // ACL mask. It's kind of rights (functions) a User is allowed to execute on the server-side
```

### OVERALL WORKFLOW

1. A `User` opens the `Client` in their web browser.
2. The `Client` checks [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) to see if there exists an `AccountToken`.
    - if the `AccountToken` does exist - see `4`
    - if the `AccountToken` does not exist - see `3`
3. The `Client` does a `GET` request to the `/create-account`
    - the `GET` request returns an `AccountToken`.
4. The `Client` does a `POST` request to the `/get-access-token` with TokenType = `GetQuestionnaire` in the body, supplying the `AccountToken` in the [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) header
    - the `POST` request returns an `AccessToken` of the `GetQuestionnaire` type
5. The `Client` renders the UI of the application
    - the UI issues the GET request to the `/questionnaire/sample` supplying the `AccessToken` of the `GetQuestionnaire` type in the [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) header
    - the server-side code verifies the `AccessToken` supplied and returns a JSON encoded questionnaire
6. The `User` spends some time filling out the questionnaire
7. The `User` clicks the submit button when they are ready
8. The `Client` does a `POST` request to the `/get-access-token` with the TokenType = `PostQuestionnaire`
    - the server-side returns an `AccessToken` of the `PostQuestionnaire` type
9. The `Client` issues the `POST` request to the `/questionnaire` supplying the questionnaire in the body and the `AccessToken` of the `PostQuestionnaire` type in the [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) header
10. The server-side resolves an appropriate recommendation for the `User` and returns it back

## TECH STACK

- Back-end
  - [NodeJs](https://nodejs.org/en/download/) `15.5.1` (use `Volta` to install it)
  - [PNPM](https://pnpm.js.org/en/motivation) `5.14.3` (use `Volta` to install it)
  - [Redis](https://redis.io/download) `6.0.9`
  - [Volta](https://volta.sh/) `1.0.0` (use it instead of `nvm`)
  - [µWebSockets.js](https://github.com/uNetworking/uWebSockets.js) `18.12.0` (`http`/`websocket` server instead of `express.js` et al), I do urge you to go see [motivation and goals](https://github.com/uNetworking/uWebSockets/blob/master/misc/READMORE.md) behind it.
  - [PM2](https://pm2.keymetrics.io/) as the process manager
- Front-end
  - [Svelte](https://svelte.dev/) (actually [Sapper](https://sapper.svelte.dev/) but it uses `Svelte`). I invite you to have a look at [why svelte is revolutionary](https://dev.to/hanna/why-svelte-is-revolutionary-415e) if you are curious to see no `ReactJS` here.
  - [OMT](https://github.com/surma/rollup-plugin-off-main-thread) plugin for Rollup to move logic to [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), so that, you know, the main thead is not blocked by anything other than rendering.
  - [xstate](https://github.com/davidkpiano/xstate) to implement logic of the `Client`.
- Common libs
  - [macaroons.js](https://github.com/nitram509/macaroons.js) to leverage the token related routines
  - [libsodium](https://github.com/jedisct1/libsodium.js) to leverage cryptography related stuff

### WHAT HAS BEEN OMITTED FROM THIS LIST

- Containers. `PM2` will be used for now. For a production deployment I would seriously consider using [Nanos unikernels](https://nanovms.gitbook.io/ops/) instead of the `Docker` specifically for [security reasons](https://nanovms.com/security). If you require more arguments, please do not hesitate to contact me for references - I have a couple of articles bookmarked somewhere.
- Any cloud related stuff. Cloud seems to be fun. And that is all there is to it really. Want to argue? I am all in, ping me (`hint`: [prices](https://cloudwars.co/amazon/amazon-lyft-8-million-per-month-cloud/), [security](https://news.softpedia.com/news/amazon-accused-of-investing-in-small-companies-stealing-their-ideas-530618.shtml), decreasing level of expertize).
- Load balancer/TLS terminator, such as [HAProxy](http://www.haproxy.org/), or [NGINX](https://nginx.org/). One of them would definitely be used in a production deployment to handle `TLS` termination and for caching static resources.
- [Google Flatbuffers](https://google.github.io/flatbuffers/) as a message format. They are not completely banned though. When the system I am about to develop is up and running I will reconsider the `flatbuffers` one more time.