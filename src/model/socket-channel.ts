import { Emitter } from './emitter';
import { Listener } from './listener';

export interface SocketChannel extends Emitter, Listener {}
