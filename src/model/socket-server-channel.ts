import { Emitter } from './emitter';

export interface SocketServerChannel extends Emitter {
  in(room: string): Emitter;
}
