const { exec, execSync } = require('child_process');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const path = require('path');

// utils/channelVoice.js

let recordingProcess;
let audioFilePath;
let recordingStartTime = 0;
let recordingInterval; // Variable para almacenar el ID del intervalo

async function joinChannelAndPrepareForAudioProcessing(interaction) {
    if (!interaction.member.voice.channelId) {
        await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
        return;
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('startRecording')
                .setLabel('Start Recording')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.reply({ content: 'Preparado para capturar audio. Usa el botón abajo para iniciar la grabación.', components: [row] });
}

async function startRecording(interaction, client) {
    try {
        recordingStartTime = Date.now();
        audioFilePath = path.join(__dirname, 'recorded-audio.wav');
        const ffmpegCommand = [
            'ffmpeg',
            '-f', 'dshow',
            '-i', `"audio=Microphone Array (Realtek(R) Audio)"`,
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '1',
            '-af', '"highpass=f=200, lowpass=f=3000"',
            '-y', audioFilePath
        ].join(' ');
        recordingProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('Error while recording:', error);
                console.error('stderr:', stderr);
                interaction.followUp({ content: 'Error al grabar el audio.', ephemeral: true });
                return;
            }
        });
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('stopRecording')
                    .setLabel('Stop Recording')
                    .setStyle(ButtonStyle.Danger)
            );
        const embed = new EmbedBuilder()
            .setTitle('Recording in progress...')
            .setDescription(`Recording started by ${interaction.user.tag}`)
            .addFields(
                { name: 'Channel', value: interaction.channel.name, inline: true },
                { name: 'Started at', value: `<t:${Math.floor(recordingStartTime / 1000)}:T>`, inline: true }
            )
            .setTimestamp()
            .setColor(0xFF0000); // Usar un valor de color válido
        await interaction.update({ content: null, embeds: [embed], components: [row] });
        // Schedule regular updates to the embed to show recording duration
        recordingInterval = setInterval(async () => {
            const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
            embed.setDescription(`Recording started by ${interaction.user.tag}\n\n**Recording duration: ${elapsedSeconds}s**`);
            await interaction.editReply({ embeds: [embed] });
        }, 5000);
    } catch (error) {
        console.error('Error in startRecording:', error);
        interaction.followUp({ content: 'An error occurred while starting the recording.', ephemeral: true });
    }
}

async function stopRecording(interaction) {
    // This code works but prduce error in terminal when this function executing
    if (recordingProcess) {
        try {
            recordingProcess.kill('SIGINT');
            execSync('taskkill /IM ffmpeg.exe /F'); // Ensure ffmpeg process is killed on Windows
            recordingProcess = null;
            clearInterval(recordingInterval);
            await interaction.reply({ content: 'Grabación detenida. Aquí tienes el archivo de audio:', files: [audioFilePath] });
        } catch (error) {
            console.error('Error stopping the recording:', error);
            await interaction.reply({ content: 'Error al detener la grabación.', ephemeral: true });
        }
    } else {
        await interaction.reply({ content: 'No hay una grabación en curso para detener.', ephemeral: true });
    }
}

module.exports = {
    joinChannelAndPrepareForAudioProcessing,
    startRecording,
    stopRecording
};