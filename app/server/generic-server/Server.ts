import * as WebSocket from "ws";
import * as http from "http";
import {ServerOptions} from "ws";
import {Client} from "./Client";
import {Session} from "./Session";
import * as iof from "io-filter";



type EventHandler<SessionObject extends Session, payloadFilter> = (payload: payloadFilter, client: Client<SessionObject>) => Promise<void>;
type EventsDescription<SessionObject extends Session> = {
    [eventName: string]: {
        payloadFilter?: iof.MaskFilter,
        handler: EventHandler<SessionObject, any>
    };
};



/**
 * Generic server object. Handle typed event communication.
 */
export class Server<SessionObject extends Session> {

    /**
     * List of accepted events.
     */
    private readonly events: EventsDescription<SessionObject> = {};

    private readonly serverConfig: ServerOptions;

    private readonly wss: WebSocket.Server;

    /**
     * Authenticate function. Returns an unique identifier that will be used to group client in a session object.
     */
    public authenticateFunction?: (request: http.IncomingMessage) => Promise<string>;

    /**
     * Retrieve a session data from its unique identifier as returned by authenticateFunction
     */
    public sessionConstructor: new (identifier: string) => SessionObject;

    constructor(serverConfig: ServerOptions, sessionConstructor: new (identifier: string) => SessionObject) {
        this.serverConfig = serverConfig;
        this.sessionConstructor = sessionConstructor;
        this.wss = new WebSocket.Server(serverConfig);
        this.wss.on('connection', this.onConnection.bind(this));
    }

    /**
     * Register a new client event
     * @param name
     * @param handler
     * @param payloadType Type of payload. If set to a string, the type of the payload should be equal to this string. Can also be set to a valid mask filter.
     */
    public registerEvent<PayloadType>(name: string, handler: EventHandler<SessionObject, PayloadType>, payloadType?: string | iof.MaskFilter): void {
        const payloadFilter = typeof payloadType === 'string' ? new iof.ValueTypeFilter(payloadType) : payloadType;
        this.events[name] = {
            handler: handler.bind(handler),
            payloadFilter: payloadFilter,
        };
    }

    /**
     * When a new client connects
     * @param webSocket
     * @param request
     */
    private async onConnection(webSocket: WebSocket, request: http.IncomingMessage): Promise<void> {

        if (typeof this.authenticateFunction !== 'function') {
            throw new Error('Authenticate function is not defined');
        }

        let identifier = await this.authenticateFunction(request);
        if (identifier === null) {
            throw new Error('Invalid identifier');
        }

        // Create a session based on the just-computed identifier
        const session = new this.sessionConstructor(identifier);

        // Load session data
        await session.load();

        // Create a new client object & attach it to the session
        const client = new Client(session, webSocket, request);

        // For every registered event
        Object.keys(this.events).forEach(eventName => {
            // Register it on the client object
            client.on(eventName, payload => this.onClientEvent(eventName, payload, client));
        });
    }

    /**
     * When a new client connects
     * @param eventName
     * @param payload
     * @param client
     */
    private async onClientEvent(eventName: keyof EventsDescription<SessionObject>, payload: any, client: Client<SessionObject>): Promise<void> {
        try {

            const event = this.events[eventName];

            // If payload filter is defined
            if (event.payloadFilter) {
                // Use it as a mask on the payload
                payload = event.payloadFilter.mask(payload);
            }

            // Call handler
            await event.handler(payload, client);

        } catch (error) {

            client.sendError(error);
        }
    }
}