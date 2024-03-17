const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.type !== InteractionType.MessageComponent) return;
        if (interaction.customId === 'startExercise') {
            await interaction.deferReply();
            startCountdown(interaction, 20 * 60);
        }
    },
};

async function startCountdown(interaction, totalTime) {
    let timeLeft = totalTime;
    await interaction.editReply({ embeds: [getEmbed(timeLeft)] });

    const countdown = setInterval(async () => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdown);
            await interaction.followUp({ embeds: [getFinishedEmbed()], components: [] });
            saveExerciseSession(interaction.user.id);
        } else if (timeLeft % 60 === 0) {
            if (timeLeft > 15 * 60) {
                await interaction.editReply({ embeds: [getEmbed(timeLeft)] });
            } else {
                await interaction.followUp({ embeds: [getEmbed(timeLeft)] });
            }
        }
    }, 1000);
}

function getEmbed(timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Static bike exercise in progress...')
        .setDescription(`Time left: ${minutes}:${seconds.toString().padStart(2, '0')}`)
        .setTimestamp();
}

function getFinishedEmbed() {
    return new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('¡Time Complete!')
        .setDescription('¡Good Work on the static bike!')
        .setTimestamp();
}

function saveExerciseSession(userId) {
    const session = {
        userId: userId,
        startTime: new Date().toISOString(),
        endTime: new Date(new Date().getTime() + 20 * 60000).toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
    };

    const sessionsFilePath = path.join(__dirname, 'exercise_sessions.json');
    let sessions = [];
    if (fs.existsSync(sessionsFilePath)) {
        sessions = JSON.parse(fs.readFileSync(sessionsFilePath));
    }
    sessions.push(session);
    fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 4));
}
