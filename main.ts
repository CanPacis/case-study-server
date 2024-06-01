import { encode, decode } from "./data/mod.ts";

import { Application, Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";

const app = new Application();
const router = new Router();

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const todos: Todo[] = [
  { id: 1, text: "Buy the milk", done: false },
  { id: 2, text: "Wash the car", done: true },
  { id: 3, text: "Write some code", done: false },
  { id: 4, text: "Feed the cat", done: true },
  { id: 5, text: "Walk the dog", done: false },
];

const encoded = encode({ type: "list", payload: todos })
console.log(encoded)
const decoded = decode<Todo[]>(encoded)
console.log(decoded)

console.log(JSON.stringify({ type: "list", payload: todos }).length)
// router.get("/todos", (ctx) => {
//   ctx.response.headers.set("Content-Type", "application/octet-stream");
//   ctx.response.body = encode({ type: "list", payload: todos });
// });

// app.use(router.routes());
// await app.listen({ port: 8080 });
