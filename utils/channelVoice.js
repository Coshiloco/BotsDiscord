const { createWriteStream } = require('fs');
const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioReceiver } = require('@discordjs/voice');
const {ffmpeg } = require('fluent-ffmpeg');
const {fs} = require('fs');

async function joinChannelAndPrepareForAudioProcessing(interaction) {

    // Ruta al archivo de audio en crudo
    const rawAudioPath = `./user-audio.pcm`;

    // Ruta donde guardarás el archivo MP3
    const mp3OutputPath = `./user-audio.mp3`;
    
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
        const receiver = connection.receiver;

        receiver.speaking.on('start', (userId) => {
            console.log(`User ${userId} started speaking.`);
            const audioStream = receiver.subscribe(userId);
            const outputStream = createWriteStream(rawAudioPath);
            audioStream.pipe(outputStream);
        });
        
        receiver.speaking.on('end', (userId) => {
            console.log(`User ${userId} stopped speaking.`);
        });

        await interaction.followUp({ content: 'I have joined the voice channel and am ready to process audio.' });
    } catch (error) {
        console.error(error);
        await interaction.followUp({ content: 'Failed to join the voice channel.', ephemeral: true });
    }
}

module.exports.joinChannelAndPrepareForAudioProcessing = joinChannelAndPrepareForAudioProcessing;
