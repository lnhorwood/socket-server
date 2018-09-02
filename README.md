# @horwood/socket-server

This is a Node.js library that acts as a wrapper around socket.io in order to support authentication and the handling of
events based on the client's authentication status.

## Getting Started

It can be installed through the NPM registry by using the following command:

```bash
$ npm install @horwood/socket-server
```

### Usage

[SecureSocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket-server.ts) provides
the ability to broadcast events to groups of users under multiple circumstances.

- Standard
  - `server.emit` - Sends an event to all clients.
  - `server.in` - Sends an event to all clients in a given room.
- Secure
  - `server.secure.emit` - Sends an event to all authenticated clients.
  - `server.secure.in` - Sends an event to all authenticated clients in a given room.
- Unsecure
  - `server.unsecure.emit` - Sends an event to all unauthenticated clients.
  - `server.unsecure.in` - Sends an event to all unauthenticated clients in a given room.

[SecureSocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket-server.ts) exposes
instances of [SecureSocket](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket.ts) which
have multiple channels available:

- Standard
  - `socket.on` - Listens to all events from client.
  - `socket.emit` - Sends all events to client.
- Secure
  - `socket.secure.on` - Listens to events when the client is authenticated.
  - `socket.secure.emit` - Sends events when the client is authenticated.
- Unsecure

  - `socket.unsecure.on` - Listens to events when the client is not authenticated.
  - `socket.unsecure.emit` - Sends events when the client is not authenticated.

When a [SocketAuthenticator](https://github.com/lnhorwood/socket-server/blob/master/src/model/socket-authenticator.ts)
is provided,
[SecureSocketServer](https://github.com/lnhorwood/socket-server/blob/master/src/model/secure-socket-server.ts) attaches
four event listeners to each connected socket.

- Standard
  - `validateToken` - Calls authenticator.validate with the given token. Responds with an event of `authenticated` and
    a payload of the token returned by the authenticator when successful. Responds with an event of
    `tokenValidationFailed` when unsuccessful.
- Secure
  - `logout` - Calls authenticator.logout with the socket's token. Regardless of the outcome, the socket is
    unauthenticated. When successful, an event of `logoutSuccess` is emitted. When unsuccessful, an event of `logoutFailed`
    is emitted.
- Unsecure
  - `login` - Calls authenticator.login with the given credentials. Responds with an event of `authenticated` and a
    payload of the token returned by the authenticator when successful. Responds with an event of `loginFailed` when
    unsuccessful.
  - `register` - Calls authenticator.login with the given credentials. Responds with an event of `authenticated` and a
    payload of the token returned by the authenticator when successful. Responds with an event of `registrationFailed` when
    unsuccessful.

```js
import { SecureSocketServer } from '@horwood/socket-server';

const authenticator = {
  login: credentials => of('exampleToken'),
  logout: () => of(null),
  validate: token => of('exampleValidatedToken')
};

const socketServer: SecureSocketServer = new SecureSocketServer().authenticator(authenticator);
socketServer.on('connection').subscribe(socket => {
  // Standard socket handling. Talks to all clients.
  socket.on('event').subscribe(payload => ...);
  socket.emit('event');
  // Secure socket handling. Talk to authenticated users.
  socket.secure.on('event').subscribe(payload => ...);
  socket.secure.emit('event');
  // Unsecure socket handling. Talk to unauthenticated users.
  socket.unsecure.on('event').subscribe(payload => ...);
  socket.unsecure.emit('event');
});
```
