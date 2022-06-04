# resty

`resty` is a fast, tiny and easy to use router made exclusively for Cloudflare Workers.

## Installation

```sh
npm install resty
```

## Usage

```ts
// my-worker.ts

import { createRouter } from "resty";

const router = createRouter();

router.get("/hello", () => new Response("world"));

export default { fetch: router }

// Or

addEventListener('fetch', (event) => {
  event.respondWith(router(event.request));
}
```

## Dynamic routes

`resty` uses [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) to match routes and extract dynamic parameters. The syntax is very similar to Express.

```ts
// my-worker.ts

import { createRouter } from "resty";

const router = createRouter();

router.get("/hello/:name", (request, params) => {
  // params is an instance of URLSearchParams. It holds both the query string and the path parameters. Path parameters take precedence over query parameters.
  const name = params.get("name");
  return new Response(`Hello ${name}`);
});

export default { fetch: router };
```

## Responses

Resty ships with a few helpers to create responses.

- status(code: number): Response
- text(text: string): Response
- json(json: any): Response
- html(html: string): Response

Resty also supports interruptin the response flow by throwing either a `Response` or an `HttpError`.

```ts
import { BadRequestError } from "resty";

router.get("/", () => {
  throw new BadRequestError("Invalid request");
});

// Or

router.get("/", () => {
  throw new Response("Invalid request", { status: 400 });
});
```

Any other error will be converted to a 500 error and logged to the console.

## Status

`resty` ships with an enum of HTTP status codes.

```ts
import { Status } from "resty";

const response = new Response(`Hello world`, { status: Status.OK });
```
