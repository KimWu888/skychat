import {Server} from "./Server";
import {Connection} from "./Connection";
import * as http from "http";
import {Session} from "./Session";
import {DatabaseHelper} from "./DatabaseHelper";
import {User} from "./User";
import * as iof from "io-filter";
import {Room} from "./Room";
import {CommandManager} from "./commands/CommandManager";


/**
 * The base server class for the skychat
 */
export class SkyChat {

    private static CURRENT_GUEST_ID: number = 0;

    private readonly room: Room = new Room();

    private readonly server: Server;

    constructor() {

        // Create server instance
        this.server = new Server({port: 8080}, this.getNewSession.bind(this));

        // Register hooks
        this.server.onConnectionCreated = this.onConnectionCreated.bind(this);

        // Load database then register server events
        DatabaseHelper
            .load()
            .then(() => {

                // On register
                this.server.registerEvent('register', this.onRegister.bind(this), new iof.ObjectFilter({
                    username: new iof.RegExpFilter(User.USERNAME_LOGGED_REGEXP),
                    password: new iof.RegExpFilter(/^.{4,512}$/),
                }));

                // Login by username & password
                this.server.registerEvent('login', this.onLogin.bind(this), new iof.ObjectFilter({
                    username: new iof.RegExpFilter(/^[a-zA-Z0-9]{3,16}$/),
                    password: new iof.RegExpFilter(/^.{4,512}$/),
                }));

                // Login using token
                this.server.registerEvent('set-token', this.onSetToken.bind(this), new iof.ObjectFilter({
                    userId: new iof.NumberFilter(1, Infinity, false),
                    timestamp: new iof.NumberFilter(- Infinity, Infinity, false),
                    signature: new iof.ValueTypeFilter('string'),
                }));

                // On message sent
                this.server.registerEvent('message', this.onMessage.bind(this), 'string');
            });
    }

    /**
     * Build a new session object when there is a new connection
     */
    private async getNewSession(request: http.IncomingMessage): Promise<Session> {
        const identifier = '*Hamster' + (++ SkyChat.CURRENT_GUEST_ID);
        return new Session(identifier);
    }

    /**
     * Called each time a new connection is created
     * @param connection
     */
    private async onConnectionCreated(connection: Connection): Promise<void> {
        this.room.attachConnection(connection);
    }

    private async onRegister(payload: any, connection: Connection): Promise<void> {
        const user = await User.registerUser(payload.username, payload.password);
        this.onAuthSuccessful(user, connection);
    }

    private async onLogin(payload: any, connection: Connection): Promise<void> {
        const user = await User.login(payload.username, payload.password);
        this.onAuthSuccessful(user, connection);
    }

    private async onSetToken(payload: any, connection: Connection): Promise<void> {
        const user = await User.verifyAuthToken(payload);
        this.onAuthSuccessful(user, connection);
    }

    /**
     * When an auth attempt is completed
     * @param user
     * @param connection
     */
    private onAuthSuccessful(user: User, connection: Connection): void {
        // Find an existing session belonging to the same user
        const recycledSession = Session.getSessionByIdentifier(user.username.toLowerCase());
        if (recycledSession) {
            // If such session exists, attach this connection to the active session
            recycledSession.attachConnection(connection);
        } else {
            // Else, update this session
            connection.session.setUser(user);
        }
        connection.send('auth-token', User.getAuthToken(user.id));
    }

    /**
     * When a message is received
     * @param payload
     * @param connection
     */
    private async onMessage(payload: string, connection: Connection): Promise<void> {

        try {

            // Apply hooks on payload
            if (! connection.room) {
                throw new Error('Messages event should be sent in rooms');
            }

            payload = await connection.room.executeNewMessageHook(payload, connection);

            // Parse command name and message content
            const {param, commandName} = CommandManager.parseMessage(payload);

            // Get command object
            const command = connection.room.commands[commandName];
            if (! command) {
                throw new Error('This command does not exist');
            }

            await command.execute(commandName, param, connection);
        } catch (e) {

            connection.sendError(e);
        }
    }
}

