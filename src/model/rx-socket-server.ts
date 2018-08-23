import { Observable } from 'rxjs';
import { RxSocket } from './rx-socket';
import { Server } from 'socket.io';

export interface RxSocketServer {
  emit<T>(event: string, payload?: T): void;
  on(event: 'connection'): Observable<RxSocket>;
}
