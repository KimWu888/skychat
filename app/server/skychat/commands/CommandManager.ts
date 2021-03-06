import { Command } from "./Command";
import { Plugin } from "./Plugin";
import { Room } from "../Room";
import { Config } from "../Config";
const impl = require('./impl/');


/**
 * Utility class that handles the list of commands and plugins
 */
export class CommandManager {

    /**
     * Load all commands and plugins
     */
    public static instantiateCommands(room: Room) {
        // Initialize command and plugin instances
        const commands: {[commandName: string]: Command} = {};
        // For every command/plugin
        for (let commandName of Config.getPlugins()) {
            // Check if the command/plugin exists
            if (typeof impl[commandName] !== 'function') {
                throw new Error(`Unable to load command/plugin ${commandName}. Ensure the corresponding file is there and the plugin class exported.`);
            }
            // Instantiate it
            const CommandConstructor = impl[commandName];
            const command = new CommandConstructor(room);
            // Add it in the command object with its name and all its aliases
            commands[command.name] = command;
            command.aliases.forEach((alias: any) => {
                commands[alias] = command;
            });
        }
        return commands;
    }

    /**
     * Load all commands and plugins
     */
    public static extractPlugins(commands: {[commandName: string]: Command}) {
        return Object.keys(commands)
            .filter(commandAlias => commands[commandAlias] instanceof Plugin)
            .filter(pluginAlias => commands[pluginAlias].name === pluginAlias)
            .map(pluginAlias => commands[pluginAlias] as Plugin)
            .sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get command name from the message
     * @param message
     */
    public static parseMessage(message: string): {param: string, commandName: string} {
        message = message.trim();
        const commandName = message.split(' ')[0].substr(1).toLowerCase();
        const param = message.substr(commandName.length + 2);
        return {param, commandName};
    }
}
