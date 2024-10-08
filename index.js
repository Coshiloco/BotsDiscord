require('dotenv').config();

const { Client, GatewayIntentBits, Collection, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');

const { startSegmentedTimer, saveExerciseSession } = require('./events/interactionCreate.js');

const allIntents = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents
    ],
});

const client = allIntents;

client.commands = new Collection();
client.buttons = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.on('messageCreate', message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

client.on('interactionCreate', async interaction => {
    try {
        const event = client.buttons.get(interaction.customId);
        if (event) event.execute(interaction, client);
        if (interaction.isButton()) {
            if (interaction.customId === 'modalForBikeTimeCustom') {
                const modal = new ModalBuilder()
                    .setCustomId('modalForBikeTimeCustomModal')
                    .setTitle('Custom Bike Session')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('sessionDuration')
                                .setLabel('Enter your session duration in minutes')
                                .setStyle(TextInputStyle.Short)
                        )
                    );
                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modalForBikeTimeCustomModal') {
                const sessionDuration = interaction.fields.getTextInputValue('sessionDuration');
                await interaction.deferReply({ ephemeral: true });
                interaction.editReply({ content: 'The timer started...' });
                startSegmentedTimer(interaction, sessionDuration * 60, client, sessionDuration);
            }
        }
    } catch (error) {
        console.error('Error in interactionCreate:', error);
        if (interaction.replied || interaction.deferred) {
            interaction.followUp({ content: 'An error occurred while processing the interaction.', ephemeral: true });
        } else {
            interaction.reply({ content: 'An error occurred while processing the interaction.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
