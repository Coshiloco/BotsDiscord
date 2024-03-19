const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'startworkout',
        description: 'Start a static bike workout session.',
    },
    async execute(message) {
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Static Bike Exercise Session')
            .setDescription('Press the button below to start your 20-minute workout session.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('startExercise')
                .setLabel('Start Workout')
                .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                .setCustomId("openModal")
                .setLabel("Set Custom Time")
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },
};

