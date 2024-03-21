const { createWriteStream } = require('fs');
const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioReceiver } = require('@discordjs/voice');

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
        const receiver = connection.receiver;

        // Suscribirse a audio de todos los hablantes. Este es un ejemplo básico.
        receiver.speaking.on('start', (userId) => {
            console.log(`User ${userId} started speaking.`);
            const audioStream = receiver.subscribe(userId);
            const outputStream = createWriteStream(`./user-audio-${userId}.pcm`);
            audioStream.pipe(outputStream);
            audioStream.on('end', () => console.log(`Audio stream for user ${userId} has ended.`));
        });

        await interaction.followUp({ content: 'I have joined the voice channel and am ready to process audio.' });
    } catch (error) {
        console.error(error);
        await interaction.followUp({ content: 'Failed to join the voice channel.', ephemeral: true });
    }
}

module.exports.joinChannelAndPrepareForAudioProcessing = joinChannelAndPrepareForAudioProcessing;
