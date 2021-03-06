import {Connection} from "../../../Connection";
import {Plugin} from "../../Plugin";
import {Session} from "../../../Session";
import {User} from "../../../User";
import {PrivateMessage} from "../../../PrivateMessage";
import { Config } from "../../../Config";


export class PrivateMessagePlugin extends Plugin {

    readonly name = 'mp';

    readonly minRight = Config.PREFERENCES.minRightForPrivateMessages;

    readonly rules = {
        mp: {
            minCount: 2,
            coolDown: 50,
            params: [{name: 'username', pattern: User.USERNAME_REGEXP}]
        }
    };

    async run(alias: string, param: string, connection: Connection): Promise<void> {

        const username = param.split(' ')[0];
        const session = Session.getSessionByIdentifier(Session.autocompleteIdentifier(username));
        if (! session) {
            throw new Error('User not found');
        }

        const content = param.split(' ').slice(1).join(' ');

        const privateMessage = new PrivateMessage({content, user: connection.session.user, to: session.user});
        connection.session.send('private-message', privateMessage.sanitized());
        session.send('private-message', privateMessage.sanitized());
    }
}
