const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const { joinChannelAndPrepareForAudioProcessing, startRecording, stopRecording } = require('../utils/channelVoice');

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId === "startExercise") {
      await interaction.deferReply({ ephemeral: true });
      interaction.editReply({ content: "The timer started..." });
      startSegmentedTimer(interaction, 20 * 60, client, 20);
    }
    if (interaction.customId === 'captureAudio') {
      await joinChannelAndPrepareForAudioProcessing(interaction);
    }

    if (interaction.customId === 'startRecording') {
      await startRecording(interaction, client);
    }

    if (interaction.customId === 'stopRecording') {
      await stopRecording(interaction);
    }
  },
};

async function startSegmentedTimer(
  interaction,
  totalTimeInSeconds,
  client,
  timeSelected
) {
  const segmentDurationInSeconds = 14 * 60;
  let remainingTime = totalTimeInSeconds;

  const handleTimerSegment = async () => {
    if (remainingTime <= 0) {
      const channel = await client.channels.fetch(interaction.channelId);
      const finishedEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("¡Time completed!")
        .setDescription("¡Good Work in the static bike!")
        .setTimestamp();
      await channel.send({ embeds: [finishedEmbed] });
      saveExerciseSession(client.user.tag, timeSelected);
      return;
    }

    const currentSegmentTime = Math.min(
      remainingTime,
      segmentDurationInSeconds
    );
    remainingTime -= currentSegmentTime;

    setTimeout(async () => {
      if (remainingTime > 0) {
        const timeUpdateEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("Exercise in progress...")
          .setDescription(
            `Time left: ${Math.floor(remainingTime / 60)}:${String(
              remainingTime % 60
            ).padStart(2, "0")}`
          )
          .setTimestamp();
        await interaction.followUp({ embeds: [timeUpdateEmbed] });
      }

      handleTimerSegment();
    }, currentSegmentTime * 1000);
  };

  handleTimerSegment();
}

function getEmbed(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("Static bike exercise in progress...")
    .setDescription(
      `Time left: ${minutes}:${seconds.toString().padStart(2, "0")}`
    )
    .setTimestamp();
}

function getFinishedEmbed() {
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("¡Time Complete!")
    .setDescription("¡Good Work on the static bike!")
    .setTimestamp();
}

function saveExerciseSession(userId, timeSelected) {
  const session = {
    userId: userId,
    startTime: new Date().toLocaleString("es-ES", { hour12: false }),
    endTime: new Date(
      new Date().getTime() + timeSelected * 60000
    ).toLocaleString("es-ES", { hour12: false }),
    date: new Date().toLocaleDateString("es-ES"),
    time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };

  const sessionsFilePath = path.join(__dirname, "exercise_sessions.json");
  let sessions = [];
  if (fs.existsSync(sessionsFilePath)) {
    sessions = JSON.parse(fs.readFileSync(sessionsFilePath));
  }
  sessions.push(session);
  fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 4));
}

module.exports.startSegmentedTimer = startSegmentedTimer;
module.exports.saveExerciseSession = saveExerciseSession;
