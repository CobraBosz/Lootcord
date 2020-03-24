module.exports = {
    name: 'togglekillfeed',
    aliases: ['setkillfeed', 'setkillchan', 'togglekillchan'],
    description: "Toggles the channel its used in as the kill feed for the server.",
    long: "Toggle the current channel as the kill feed channel, will log all kills from the server in that channel.\nUser **MUST** have the Manage Server permission.",
    args: {},
    examples: ["togglekillfeed"],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: true,
    
    async execute(app, message){
        const row = (await app.query(`SELECT * FROM guildInfo WHERE guildId ="${message.guild.id}"`))[0];
        
        if(row.killChan == 0){
            await app.query(`UPDATE guildInfo SET killChan = ${message.channel.id} WHERE guildId = ${message.guild.id}`);

            message.reply('✅ Set this channel as the kill feed channel!');
        }
        else{
            await app.query(`UPDATE guildInfo SET killChan = 0 WHERE guildId = "${message.guild.id}"`);

            message.reply('✅ Disabled kill feed for this server!');
        }
    },
}