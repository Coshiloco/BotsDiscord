const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId === 'startExercise') {
            await interaction.deferUpdate();
            const totalTime = 20 * 60; // 20 min to seconds 
            startCountdown(interaction, totalTime);
        }
    },
};

function startCountdown(interaction, totalTime) {
    let timeLeft = totalTime;

    const countdown = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(countdown);
            const finishedEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('¡Time Complete!')
                .setDescription('¡Good Work on the static bike!')
                .setTimestamp();
            interaction.editReply({ embeds: [finishedEmbed], components: [] });
            saveExerciseSession(interaction.user.id);
            return;
        }

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Static bike exercise in progress...')
            .setDescription(`Time left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`)
            .setTimestamp();

        interaction.editReply({ embeds: [embed] });
        timeLeft--;
    }, 1000);
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
