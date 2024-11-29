import fastify from 'fastify';
import { it } from 'node:test';
import assert from 'node:assert';
import { connect } from 'node:http2';

it('shuts down the server', async () => {
  // Create an http2 server with the default session timeout
  const server = fastify({
    http2: true,
    forceCloseConnections: true,
    keepAliveTimeout: 1,
    // http2SessionTimeout: 3,
  });

  server.get('/', async function handler(_request, _reply) {
    return { hello: 'world' };
  });

  await server.listen({
    host: 'localhost',
    port: 0,
  });

  // Make an http2 request to the server, without closing the client
  // https://nodejs.org/api/http2.html#client-side-example
  await new Promise((resolve) => {
    const client = connect(`http://localhost:${server.server.address().port}`);
    const req = client.request({ ':path': '/' });
    req.on('response', (headers) => {
      for (const name in headers) {
        console.log(`${name}: ${headers[name]}`);
      }
    });

    req.setEncoding('utf8');
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      console.log(`\n${data}`);
      // We *don't* close the client here
      // client.close();
      resolve();
    });
    req.end();
  });

  const start = Date.now();

  await server.close();

  const end = Date.now();

  assert.equal(end - start < 10_000, true);
});
