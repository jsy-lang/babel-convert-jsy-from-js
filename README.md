# babel-convert-jsy-from-js
Convert JavaScript, Babel or Babylon AST into offside indented JSY formatted source code.

Plese see [JSY language docs](https://github.com/jsy-lang/jsy-lang-docs) for details on the JSY dialect.

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
const http = require('http')

const hostname = '127.0.0.1'
const port = 3000

const server = http.createServer @
  (req, res) => ::
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    res.end('Hello World\n')


server.listen @
  port
  hostname
  () => ::
    console.log(`Server running at http://${hostname}:${port}/`)
```
