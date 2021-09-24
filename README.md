# resty

> A simple way to organize your next API route handlers.

## Installation

```
npm install resty
```

## Usage

```typescript
// file: src/pages/api/users.ts

import { Response, HttpStatus, post, get, handle } from "resty";
import { prisma } from "src/db";

const postUser = post(async (request) => {
  const body = await request.json();
  return Response.json(body, HttpStatus.CREATED);
});

const listUsers = get(async (request) => {
  const users = await prisma.user.findMany();
  return Response.json(users);
});

export default handle(postUsers, listUsers);
```

You should disable the default body parsing of Next.js to delegate that task to `request.json()`.

```typescript
// file: src/pages/api/users.ts

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};
```

Or

```typescript
// file: src/pages/api/users.ts

import { pageConfig } from "resty";

export const config = pageConfig();
```

> NOTE: One drawback is that Next.js currently do not support disabling body parsing globally, so you have to specify it manually on every api route.

## Why do I need this?

Mostly, this is syntactic sugar. But it also provides a way for you to separate your `request handlers` from your actual routes so you can write them and test them in isolation. Consider this:

```typescript
// file: src/rest/postUser.ts

import { Response, HttpStatus, post } from "resty";

export const postUser = post(async (request) => {
  // ... some logic
  return Response.empty(HttpStatus.CREATED);
});
```

And then in your actual api route:

```typescript
// file: src/routes/api/users.ts

import { handle } from "resty";
import { postUser } from "src/rest/postUser";

export default handle(postUser);
```

Also, it has built-in automatic error handling. You can still write your own `try-catch` blocks if you need more granular control over the response.

Last but not least, I hate having to write `if-else` blocks for handling different http methods like so:

```typescript
const handler: NextApiHandler = (req, res) => {
  if (req.method === "POST") {
    // do something
  } else if (req.method === "GET") {
    // do something else
  } else {
    // some fallback
  }
};
```

## API

### Request

- `.arrayBuffer(): Promise<ArrayBuffer>`
- `.blob(): Promise<Blob>`
- `.buffer(): Promise<Buffer>`
- `.formData(): Promise<URLSearchParams>`
- `.json(): Promise<unknown>`
- `.text(): Promise<text>`

### Response

- `#buffer(buf: Buffer, init?: ResponseInit): Response`
- `#empty(status?: HttpStatus, headers?: HeadersInit): Response`
- `#json(data: unknown, init?: ResponseInit): Response`
- `#stream(readable: Readable, init?: ResponseInit): Response`
- `#text(data: string, init?: ResponseInit): Response`
