
module.exports = {
    name: 'clan',
    aliases: ['clans'],
    description: 'The base command for everything to do with clans!',
    long: 'The base command for all clan commands. For a detailed look at all the clan commands and how clans work check out: https://github.com/blobfysh/Lootcord/wiki/Clans.',
    args: {},
    examples: ["clan info mod squad"],
    ignoreHelp: true,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const scoreRow = await app.player.getRow(message.author.id);
        
        let commandName = message.args[0] ? message.args[0].toLowerCase() : undefined;
        const command = app.clanCommands.get(commandName) || app.clanCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if(!command){
            try{
                return app.clanCommands.get('info').execute(app, message, message.args);
            }
            catch(err){
                console.log(err);
            }
        }
        else if(scoreRow.clanId == 0 && command.requiresClan){
            return message.reply('You are not a member of any clan.');
        }
        else if(scoreRow.clanRank < command.minimumRank){
            return message.reply('Your clan rank is not high enough to use this command! Your rank: `' + app.clan_ranks[scoreRow.clanRank].title + '` Required: `' + app.clan_ranks[command.minimumRank].title + '`+');
        }
        else if(command.levelReq && scoreRow.level < command.levelReq){
            return message.reply('❌ You must be atleast level `' + command.levelReq + '` to use this command!');
        }
        
        try{
            command.execute(app, message, message.args.slice(1));
        }
        catch(err){
            console.log(err);
        }
    },
}