# resty

> Syntactic sugar for [RESTful](http://restful.info) APIs.

`resty` is a very thin layer on top of Node's http module that provides a beautiful, simple, and easy to use API for building RESTful APIs. It is mostly syntactic sugar for the Node http module, but it also provides a few additional features:

- A radix-tree based routing system that allows you to define routes in a declarative way.
- A simple and powerful way to validate request parameters and JSON payloads using [typed](https://github.com/brielov/typed) (it is a direct dependency).
- Built-in error handling that automatically generates error responses for you.
- Separation of concerns: write your http handlers in a modular way, and use the `createHandler` function to glue them together.
- Type-safe request and response objects.

Note that at the time of writing `resty` has not been fully tested in the real world and is not recommended for production use (yet). You can play around with it on small, personal projects and report any issues you find until it becomes stable enough to be taken seriously.

As you see in some of the examples below, `resty` and [prisma](https://prisma.io) play very well together.

## Installation

```
npm install resty
```

## Usage

```typescript
import { createServer } from "http";
import { get, post, createHandler, Response, HttpStatus } from "resty";
import * as T from "typed";

const postType = T.object({
  title: T.string,
  body: T.string,
});

const getPosts = get("/posts", async () => {
  const posts = await prisma.post.findMany();
  return Response.json(posts);
});

const createPost = post("/posts", async (request) => {
  const data = await request.json(postType);
  const post = await prisma.post.create({ data });
  return Response.json(post, { status: HttpStatus.CREATED });
});

const handler = createHandler(getPosts, createPost);
const server = createServer(handler);

server.listen(4000, () => console.log("Listening on port 4000"));
```

## With connect

If you want to use global middlewares, you can combine `resty` with `connect`.

```typescript
import { createServer } from "http";
import { post, createHandler, Response, HttpStatus } from "resty";
import connect from "connect";
import logger from "morgan";
import cors from "cors";

const app = connect();
const server = createServer(app);
const handler = createHandler(/* ...routes */);

app.use(logger("dev"));
app.use(cors());
app.use(handler);

server.listen(4000, () => console.log("Listening on port 4000"));
```

## Authentication

`resty` does not have built-in authentication / authorization. Instead, I recommend moving this logic to a separate helper function.

```typescript
import { Request, HttpStatus, HttpError } from "resty";
import * as T from "typed";
import jwt from "jsonwebtoken";

const tokenType = T.object({
  sub: T.string,
  iat: T.number,
  exp: T.number,
});

export type Token = T.Infer<typeof tokenType>;

export const authenticate = (request: Request): Token => {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = tokenType(decoded);

    if (result.success) {
      return result.value;
    }
  }

  throw new HttpError(HttpStatus.UNAUTHORIZED);
};

// later in your routes

const postMovie = post("/movies", async (request) => {
  const token = authenticate(request);
  const data = await request.json(movieType);
  const movie = await prisma.movie.create({ data });
  return Response.json(movie, { status: HttpStatus.CREATED });
});
```

## Dynamic and query params

The beauty of `resty` is that you can define routes in a declarative way. You can define routes that accept dynamic parameters, like `/movies/:id`. Combined with the `typed` library, this allows you to define the type of the dynamic parameter and validate it along with the parsed query string.

```typescript
import { get, Response } from 'resty';
import * as T from 'typed';

const queryType = T.object({
  id: T.asNumber,
  take: T.defaulted(T.asNumber 5),
  skip: T.defaulted(T.asNumber, 0),
});

const getMovies = get("/movies/:id/similar", async (request) => {
  // This is ensured by `queryType`. If anything goes wrong, a 400 "Bad Request" is returned.
  const { id, take, skip } = request.query(queryType); // => { id: 123, take: 5, skip: 0 }
  const movies = await prisma.movie.findUnique({ where: { id }}).similar({ take, skip });
  return Response.json(movies)
});
```

## File uploads

Although technically `resty` does not support file uploads (meaning it can't handle `multipart/form-data` requests), you can still accept a single file upload in your route.
This days it is uncommon to store files directly on your server. You probably want to store them somewhere else, like S3, Cloudinary or Google Cloud Storage. So you can create an endpoint that accepts a single file upload and returns a URL to the remote file instead. Let me explain.

```typescript
// On the server

const pipeToS3 = async (stream: Readable, filename: string) => {
  const s3 = new AWS.S3();
  const params = { Bucket: "my-bucket", Key: filename, Body: stream };
  await s3.upload(params).promise();
  return `https://s3.amazonaws.com/my-bucket/${filename}`;
};

const postFile = post("/files", async (request) => {
  const stream = new PassThrough();
  request.pipe(stream);
  const ext = mime.getExtension(request.headers["content-type"]);
  const url = await pipeToS3(stream, nanoid() + "." + ext);
  return Response.json({ url }, { status: HttpStatus.CREATED });
});

// On the client

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  const response = await fetch("/files", {
    method: "POST",
    body: file,
    headers: [
      ["content-type", file.type],
      ["content-length", file.size.toString()],
    ],
  });
  const { url } = await response.json();
  console.log("File uploaded to", url);
});
```

This won't even touch your server hard drives, it will stream the incoming file directly to S3 and return a URL to the file. I know is hacky but it works.
