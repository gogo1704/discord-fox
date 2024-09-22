import * as fs from 'node:fs';
import { Client, Collection, GatewayIntentBits } from "discord.js";
import config from "./config.json" with { type: "json" };

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.cooldowns = new Collection();
client.commands = new Collection();

const commandFilePaths = fs.readdirSync("commands", { recursive: true }).filter(file => file.endsWith('.js'));

async function setCommand(filePath) {
	const importedCommand = await import(filePath);
	const command = importedCommand.default;
	if (!("data" in command) || !('execute' in command)) {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		return;
	}
	client.commands.set(command.data.name, command);
}


for (const commandFilePath of commandFilePaths) {
	setCommand(`./commands/${commandFilePath}`);
}

const eventFilePaths = fs.readdirSync("events", { recursive: true }).filter(file => file.endsWith('.js'));


async function registerEventListener(filePath) {
	const importedEvent = await import(filePath);
	const event = importedEvent.default;
	if (!('execute' in event)) {
		console.log(`[WARNING] The event at ${filePath} is missing a required "execute" property.`);
		return;
	}

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

for (const eventFilePath of eventFilePaths) {
	registerEventListener(`./events/${eventFilePath}`);
}

client.login(config.token)
