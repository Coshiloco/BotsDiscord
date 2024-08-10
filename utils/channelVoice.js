const { createWriteStream } = require('fs');
const { exec } = require('child_process');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');

let recordingProcess;
let audioFilePath;

async function joinChannelAndPrepareForAudioProcessing(interaction) {
    if (!interaction.member.voice.channelId) {
        await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
        return;
    }

    const voiceChannel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30e3);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('startRecording')
                    .setLabel('Start Recording')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stopRecording')
                    .setLabel('Stop Recording')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );

        await interaction.reply({ content: 'Preparado para capturar audio. Usa los botones abajo para iniciar o detener la grabación.', components: [row] });
    } catch (error) {
        console.error(error);
        await interaction.followUp({ content: 'Failed to join the voice channel.', ephemeral: true });
    }
}

function startRecording(interaction) {
    interaction.deferReply();  // Defer the reply immediately

    audioFilePath = path.join(__dirname, 'recorded-audio.wav');

    const ffmpegCommand = [
        'ffmpeg',
        '-f', 'dshow',
        '-i', 'audio=Microphone Array (Realtek(R) Audio)', // Ajusta esto al dispositivo correcto
        '-acodec', 'pcm_s16le',
        '-ar', '44100',
        '-ac', '1',
        '-af', 'highpass=f=200, lowpass=f=3000',
        '-y', audioFilePath
    ].join(' ');

    recordingProcess = exec(ffmpegCommand, (error) => {
        if (error) {
            console.error('Error while recording:', error);
            interaction.followUp({ content: 'Error al grabar el audio.', ephemeral: true });
        }
    });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('startRecording')
                .setLabel('Start Recording')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('stopRecording')
                .setLabel('Stop Recording')
                .setStyle(ButtonStyle.Danger)
        );

    interaction.update({ components: [row] });
}

function stopRecording(interaction) {
    if (recordingProcess) {
        recordingProcess.kill('SIGINT');
        recordingProcess = null;

        interaction.followUp({ content: 'Grabación detenida. Aquí tienes el archivo de audio:', files: [audioFilePath] });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('startRecording')
                    .setLabel('Start Recording')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('stopRecording')
                    .setLabel('Stop Recording')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );

        interaction.update({ components: [row] });
    }
}

module.exports = {
    joinChannelAndPrepareForAudioProcessing,
    startRecording,
    stopRecording
};
