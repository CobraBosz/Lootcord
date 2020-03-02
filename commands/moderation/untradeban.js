const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const config = require('../../json/_config.json');

module.exports = {
    name: 'untradeban',
    aliases: [''],
    description: 'Removes trade ban from a user.',
    hasArgs: false,
    worksInDM: false,
    requiresAcc: false,
    guildModsOnly: false,
    modOnly: true,
    adminOnly: false,
    
    async execute(message, args, lang, prefix){
        if(message.channel.id !== config.modChannel){
            return message.reply('You must be in the mod-command-center!');
        }

        var userNameID = args[0];
                        
        if(userNameID !== undefined){
            if(!message.client.sets.tradeBannedUsers.has(userNameID)){
                message.reply("That user isn't trade banned.");
            }
            else{
                const banMsg = new Discord.RichEmbed()
                .setAuthor(`✅ Trade ban has been removed from your account.`)
                .setTitle("**" + message.author.tag + "** unbanned your account!")
                .setColor(720640)

                try{
                    const bannedUser = await message.client.fetchUser(userNameID);
                    
                    query(`DELETE FROM tradebanned WHERE userId ="${bannedUser.id}"`);

                    message.client.shard.broadcastEval(`this.sets.tradeBannedUsers.delete('${bannedUser.id}')`);
                    message.reply("User ("+ bannedUser.tag +") successfully unbanned.");

                    await bannedUser.send(banMsg);
                }
                catch(err){
                    message.reply("```" + err + "```");
                }
            }
        }
        else{
            message.reply("Please use the user ID `"+prefix+"untradeban (ID)`");
        }
    },
}