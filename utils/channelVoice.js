const { joinVoiceChannel, getVoiceConnection, createAudioResource, StreamType, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

async function joinChannelAndPrepareForAudioProcessing(interaction) {
    if (!interaction.member.voice.channelId) {
        await interaction.reply('You need to be in a voice channel.');
        return;
    }

    const voiceChannel = interaction.member.voice.channel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 20e3);

        await interaction.followUp('I have joined the voice channel and I am ready to process audio.');

    } catch (error) {
        console.error(error);
        await interaction.followUp('Failed to join the voice channel.');
    }
}


module.exports.joinChannelAndPrepareForAudioProcessing = joinChannelAndPrepareForAudioProcessing;


