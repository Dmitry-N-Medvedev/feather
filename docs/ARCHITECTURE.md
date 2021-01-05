# architecture

## what to be done

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

### questionnaire

- First name
- Address
- If they have any children (boolean)
  - If yes → How many do they have?
- Their occupation
  - Employed
  - Student
  - Self-employed
- Email address

### response codes and errors

A successful response will have either `200` or `201` status code. A response containing an error will be either `422`, `401` or `500`.

The `422` response should have human readable validation errors.

## how it is done


### terminology

- `System` - a software system capable of recommending insurance options for `Users`.
- `User` - (hopefully) a human being who wishes to get recommendations from the `System`.
- `Client` - is a web application that the `User` uses to interact with the `System`.
- Tokens
  - `AccountToken` - a token that uniquely identifies a specific `User`/`Client` combination
  - `AccessToken` - a token representing a specific grant for a specific `User`/`Client`. An AccessToken can be of one of the following types:
    - `GetQuestionnaire` type allows a `Client` to request a description of a questionnaire from the `System`
    - `PostQuestionnaire` type allows a `Client` to transmit the filled out questionnaire to the `System`

### notes on Token format

#### AccountToken

```javascript
{
  uid: 000, // represents the User Id; 128 bit minimum; see randombytes_buf: https://libsodium.gitbook.io/doc/generating_random_data
}
```

The `AccountToken` is encrypted with a secret key readable only by the token related part of the System.

#### AccessToken

An AccountToken is a [google macaroon](https://research.google/pubs/pub41892/).

### overall workflow

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
7. The `User` spends some time filling out the questionnaire
8. The `User` clicks the submit button when they are ready
9. The `Client` does a `POST` request to the `/get-access-token` with the TokenType = `PostQuestionnaire`
    - the server-side returns an `AccessToken` of the `PostQuestionnaire` type
10. The `Client` issues the `POST` request to the `/questionnaire` supplying the questionnaire in the body and the `AccessToken` of the `PostQuestionnaire` type in the [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) header
11. The server-side resolves an appropriate recommendation for the `User` and returns it back
