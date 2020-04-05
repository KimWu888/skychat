import { EventEmitter } from "events";


export class SkyChatClient extends EventEmitter {

    constructor(config, store) {
        super();
        this.config = config;
        this.webSocket = null;
        this.store = store;
        this.bind();
    }

    /**
     * Connect to the server
     */
    connect() {
        this.webSocket = new WebSocket('ws://' + this.config.host + ':' + this.config.port);
        this.webSocket.addEventListener('open', this.onWebSocketConnect.bind(this));
        this.webSocket.addEventListener('message', this.onWebSocketMessage.bind(this));
        this.webSocket.addEventListener('close', this.onWebSocketClose.bind(this));
    }

    /**
     * Bind own event listeners
     */
    bind() {
        this.on('message', this.onMessage.bind(this));
        this.on('set-user', this.onSetUser.bind(this));
        this.on('connected-list', this.onConnectedList.bind(this));
        this.on('yt-sync', this.onYtSync.bind(this));
        this.on('auth-token', this.onAuthToken.bind(this));
        this.on('typing-list', this.onTypingList.bind(this));
        this.on('error', this.onError.bind(this));
    }

    /**
     * When the connection is made with the websocket server
     */
    onWebSocketConnect() {
        const authToken = localStorage.getItem(SkyChatClient.LOCAL_STORAGE_TOKEN_KEY);
        if (authToken) {
            this.sendEvent('set-token', JSON.parse(authToken));
        }
    }

    /**
     * When a message is received on the websocket
     * @param message
     */
    onWebSocketMessage(message) {
        const data = JSON.parse(message.data);
        const eventName = data.event;
        const eventPayload = data.data;
        this.emit(eventName, eventPayload);
    }

    /**
     *
     */
    onWebSocketClose(code, reason) {
        setTimeout(this.connect.bind(this), 1000);
    }

    /**
     * Emit an event to the server
     * @param eventName
     * @param payload
     */
    sendEvent(eventName, payload) {
        if (!this.webSocket) {
            return;
        }
        this.webSocket.send(JSON.stringify({
            event: eventName,
            data: payload
        }));
    }

    /**
     * Send a message to the server
     * @param message
     */
    sendMessage(message) {
        this.sendEvent('message', message);
    }

    /**
     * Set typing state
     * @param typing
     */
    setTyping(typing) {
        this.sendMessage('/t ' + (typing ? 'on' : 'off'));
    }

    /**
     * Synchronize the youtube player
     */
    ytSync() {
        this.sendMessage('/yt sync');
    }

    /**
     * Login
     * @param username
     * @param password
     */
    login(username, password) {
        this.sendEvent('login', { username, password });
    }

    /**
     * Register
     * @param username
     * @param password
     */
    register(username, password) {
        this.sendEvent('register', { username, password });
    }

    /**
     *
     * @param token auth token
     */
    onAuthToken(token) {
        if (token) {
            localStorage.setItem(SkyChatClient.LOCAL_STORAGE_TOKEN_KEY, JSON.stringify(token));
        } else {
            localStorage.removeItem(SkyChatClient.LOCAL_STORAGE_TOKEN_KEY);
        }
    }

    /**
     *
     * @param message
     */
    onMessage(message) {
        this.store.commit('NEW_MESSAGE', message);
    }

    /**
     *
     * @param user
     */
    onSetUser(user) {
        this.store.commit('SET_USER', user);
    }

    /**
     *
     * @param users
     */
    onConnectedList(users) {
        this.store.commit('SET_CONNECTED_LIST', users);
    }

    /**
     *
     * @param video
     */
    onYtSync(video) {
        this.store.commit('SET_CURRENT_VIDEO', video);
    }

    /**
     *
     * @param users
     */
    onTypingList(users) {
        this.store.commit('SET_TYPING_LIST', users);
    }

    /**
     *
     */
    onError(error) {
        alert(error);
    }
}

SkyChatClient.LOCAL_STORAGE_TOKEN_KEY = 'auth-token';

