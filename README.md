# babel-convert-jsy-from-js
Convert JavaScript, Babel or Babylon AST into offside indented JSY formatted source code.

Currently (2017-Dec-01) it converts function/method definitions and if/while/for/try/catch control flow statements to JSY.

##### TODO

- [ ] Translate function calls to use `@` shorthand. e.g. `someCallable @ ... args`
  - [ ] Translate function calls of object literals to use `@:` shorthand
  - [ ] Translate function calls of lists to use `@#` shorthand
- [ ] Translate object expressions to use `@{}`
- [ ] Translate array expressions to use `@[]`

### Use

```bash
$ npm install --save-dev babel-convert-jsy-from-js
$ cat node_about_example.js
```

###### node_about_example.js

```javascript
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

##### Convert to JSY from JS

```bash
$ npx jsy-from-js node_about_example.js
```

###### jsy output:

```javascript
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => ::
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
);

server.listen(port, hostname, () => ::
  console.log(`Server running at http://${hostname}:${port}/`);
);
```

### JSY With a little manual cleanup…

```javascript
const http = require('http')

const hostname = '127.0.0.1'
const port = 3000

const server = http.createServer @ (req, res) => ::
  res.statusCode = 200
  res.setHeader @ 'Content-Type', 'text/plain'
  res.end @ 'Hello World\n'

server.listen @ port, hostname, () => ::
  console.log @ `Server running at http://${hostname}:${port}/`
```

