module.exports = {
    data: {
        name: 'ping',
        description: 'Ping!',
    },
    async execute(message) {
        console.log('Ping command executed');
        message.channel.send('Pong.');
    },
};