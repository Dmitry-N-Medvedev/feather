# Auth Server

The `NGINX` will forward `GET` requests to the `Auth Server` before serving `*.json` files to the `Client`.

The `Auth Server` should reply with either code:

* `200` - to notify the NGINX that the `Client` is authenticated/authorized to get the file
* `401` - to notify the NGINX that the `Client` is **`NOT`** authenticated or authorized to get the file

The `Client` must pass a macaroon token in the [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) header.

```html
Authorization: <type> <credentials>
```

Where `type` is an empty string, and `credentials` is a serialized macaroon. Here how it looks like:

```html
Authorization: MDAwZmxvY2F0aW9uIDIKMDAzZWlkZW50aWZpZXIgMjpkTDMtTFZaLXhETGJCNzlQUnAzcUVvei1XMFZVQ0hSN19YT2p1R0wzdFFnPQowMDFiY2lkIDE6W29iamVjdCBQcm9taXNlXQowMDI2Y2lkIDI6MTYxMDY0MTA3NTg3NDoxNjEwNjQxMDc2Mzc0CjAwMjFjaWQgNDoxOjI0bDRHX2NFV1FqZ0FFYUEuSUloCjAwMmZzaWduYXR1cmUgmeFjNl_dLdBb0dTmE23_D06v_OzmoOjFzVaNux4U_0UK
```
