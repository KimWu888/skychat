import {Command} from "../../Command";
import {Connection} from "../../../Connection";
import {UserController} from "../../../UserController";


export class HistoryClearPlugin extends Command {

    readonly name = 'historyclear';

    readonly aliases = ['hc'];

    readonly minRight = 30;

    readonly rules = {
        historyclear: {coolDown: 10000,},
        hc: {coolDown: 10000,},
    };

    async run(alias: string, param: string, connection: Connection): Promise<void> {
        await UserController.buy(connection.session.user, 100);
        this.room.clearHistory();
    }
}
