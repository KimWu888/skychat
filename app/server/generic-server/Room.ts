import {Session} from "./Session";
import {Connection} from "./Connection";


export class Room {

    /**
     * Sessions that are within this room
     */
    public connections: Connection<Session>[] = [];

    /**
     * Detach a connection from this room
     * @param connection
     */
    public detachSession(connection: Connection<Session>) {
        this.connections = this.connections.filter(c => c !== connection);
    }

    /**
     * Attach a connection to this room
     * @param connection
     */
    public attachConnection(connection: Connection<Session>) {
        if (connection.room === this) {
            return;
        }
        if (connection.room) {
            connection.room.detachSession(connection);
        }
        connection.room = this;
        this.connections.push(connection);
    }

    /**
     * Send to all sessions
     * @param event
     * @param payload
     */
    public send(event: string, payload: any): void {
        this.connections.forEach(connection => connection.send(event, payload));
    }
}