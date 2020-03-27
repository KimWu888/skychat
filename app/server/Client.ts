import * as WebSocket from "ws";
import * as http from "http";
import {Data} from "ws";
import {EventEmitter} from "events";
import {Session} from "./Session";


/**
 * A client is basically a wrapper around a WebSocket
 */
export class Client<SessionObject extends Session> extends EventEmitter {

    public readonly session: SessionObject;

    private readonly webSocket: WebSocket;

    /**
     * Handshake request object
     */
    private readonly request: http.IncomingMessage;

    constructor(session: SessionObject, webSocket: WebSocket, request: http.IncomingMessage) {
        super();

        this.session = session;
        this.webSocket = webSocket;
        this.request = request;

        this.session.attachClient(this);
        this.webSocket.on('message', message => this.onMessage(message));
    }

    /**
     * When a message is received on the socket
     * @param data
     */
    private async onMessage(data: Data): Promise<void> {

        try {

            // If data is not of type string, fail with error
            if (typeof data !== 'string') {
                throw new Error('Incorrect message');
            }

            // Decode & unpack message
            const decodedMessage = JSON.parse(data);
            const eventName = decodedMessage.event;
            const payload = decodedMessage.data;

            // Check that the event name is valid and is registered
            if (typeof eventName !== 'string') {
                throw new Error('Event could not be parsed');
            }

            // Call handler
            this.emit(eventName, payload);

        } catch (error) {

            this.sendError(error);
        }
    }

    /**
     * Send en event to the client
     * @param event
     * @param payload
     */
    public send(event: string, payload: any) {
        this.webSocket.send(JSON.stringify({
            event,
            data: payload
        }));
    }

    /**
     * Send an error back to the client
     * @param error
     */
    public sendError(error: Error): void {
        this.webSocket.send(JSON.stringify({
            event: 'error',
            data: error.message
        }));
    }
}
