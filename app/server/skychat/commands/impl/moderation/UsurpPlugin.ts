import {Command} from "../../Command";
import {Connection} from "../../../Connection";
import {User} from "../../../User";
import {Session} from "../../../Session";


export class UsurpPlugin extends Command {

    readonly name = 'usurp';

    readonly minRight = 100;

    readonly opOnly = true;

    readonly rules = {
        usurp: {
            minCount: 2,
            params: [{name: 'username', pattern: User.USERNAME_REGEXP}, {name: 'command', pattern: /./}]
        },
    };

    async run(alias: string, param: string, connection: Connection): Promise<void> {
        const identifier = Session.autocompleteIdentifier(param.split(' ')[0]);
        const commandName = Session.autocompleteIdentifier(param.split(' ')[1]);
        const session = Session.getSessionByIdentifier(identifier);
        if (! session || session.connections.length === 0) {
            throw new Error('User ' + identifier + ' does not exist');
        }
        const command = this.room.getPlugin(commandName);
        await command.run(
            commandName,
            param.split(' ').slice(2).join(' '),
            session.connections[0],
            session,
            session.user,
            this.room
        );
    }
}
