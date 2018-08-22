# @horwood/socket-server

This is a Node.js library that acts as a wrapper around socket.io in order to support authentication and the handling of
events based on the client's authentication status.

## Getting Started

It can be installed through the NPM registry by using the following command:

```bash
$ npm install @horwood/socket-server
```

### Usage

There are three types of socket server available:

- [SocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/socket-server.ts)
  - Listens to all events from all clients.
  - Sends all events to all clients.
  - Maps connected sockets to instances of
    [RxSocket](https://github.com/lnhorwood/socket-server/blob/master/src/model/rx-socket.ts).
  - Provides 'secure' and 'unsecure' functions that provide instances of the
    [SecureSocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket-server.ts) and
    [UnsecureSocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/unsecure-socket-server.ts)
    respectively.
- [SecureSocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket-server.ts)
  - Listens to all events from all authenticated clients.
  - Sends all events to all authenticated clients.
  - Maps connected sockets to instances of
    [SecureSocket](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket.ts).
- [UnsecureSocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/unsecure-socket-server.ts)
  - Listens to all events from all unauthenticated clients.
  - Sends all events to all unauthenticated clients.
  - Maps connected sockets to instances of
    [UnsecureSocket](https://github.com/lnhorwood/socket-server/blob/master/src/model/unsecure-socket.ts).

There are three types of socket available:

- [RxSocket](https://github.com/lnhorwood/socket-server/blob/master/src/model/rx-socket.ts)
  - Listens to all events from client.
  - Sends all events to client.
- [SecureSocket](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket.ts)
  - Listens to events when the client is authenticated.
  - Sends events when the client is authenticated.
  - Adds listeners for 'login', 'logout' and 'validateToken' events which delegate to the provided
    [SocketAuthenticator](https://github.com/lnhorwood/socket-server/blob/master/src/model/socket-authenticator.ts).
    - login - Responds with event 'authenticated' and a payload of the given token when successful. Responds with
      'loginFailed' and a payload of the given error when unsuccessful.
    - logout - Responds with event 'logoutSuccess' and an empty payload when successful. Responds with 'logoutFailed'
      and a payload of the given error when unsuccessful.
    - validateToken - Responds with event 'authenticated' and a payload of the given token when successful. Responds
      with 'tokenValidationFailed' and a payload of the given error when unsuccessful.
- [UnsecureSocket](https://github.com/lnhorwood/socket-server/blob/master/src/model/unsecure-socket.ts)
  - Listens to events when the client is not authenticated.
  - Sends events when the client is not authenticated.

```js
import { SocketServer } from "@horwood/socket-server";

const socketServer = new SocketServer();
socketServer.on("connection").subscribe(socket => {
  // Standard socket handling. Talks to all clients.
});
socketServer
  .unsecure()
  .on("connection")
  .subscribe(socket => {
    // Talks to unauthenticated clients.
  });
const authenticator = {
  login: credentials => of("exampleToken"),
  logout: () => of(null),
  validate: token => of("exampleValidatedToken")
};
socketServer
  .secure(authenticator)
  .on("connection")
  .subscribe(socket => {
    // Talks to authenticated clients.
    // Listens to 'login', 'logout' and 'validateToken' events when unauthenticated. Delegates to authenticator.
  });
```
