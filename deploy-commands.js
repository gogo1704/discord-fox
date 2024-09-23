import { REST, Routes } from "discord.js";
import config from "./config.json" with { type: "json" };
import * as fs from 'node:fs/promises';

async function getScriptFilesFromDirectory(directory) {
	const files = await fs.readdir(directory, { recursive: true });
	return files.filter(file => file.endsWith('.js'));
}

async function getCommandDataJSON(filePath) {
	const importedCommand = await import(filePath);
	const command = importedCommand.default;
	if (!("data" in command) || !('execute' in command)) {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		return;
	}
	return command.data.toJSON();
}

async function getAllCommandDataArray(filePathsArray) {
	const commandDataArray = [];
	for (const commandFilePath of filePathsArray) {
		commandDataArray.push(getCommandDataJSON(`./commands/${commandFilePath}`));
	}
	return await Promise.all(commandDataArray);
}

async function deployCommands(commandDataArray) {
	try {
		console.log(`Started refreshing ${commandDataArray.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId),
			{ body: commandDataArray },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
}

const commandFilePaths = await getScriptFilesFromDirectory("commands");

const commandData = await getAllCommandDataArray(commandFilePaths);

const rest = new REST().setToken(config.token);

deployCommands(commandData);
