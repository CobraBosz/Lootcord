const Discord = require('discord.js');
const { query } = require('../../mysql.js');
const clans = require('../../methods/clan_methods.js');

// TODO check if clan member count is equal to 20 before allowing invite to clan

module.exports = {
    name: 'demote',
    aliases: [''],
    description: 'Demote a user in your clan.',
    minimumRank: 2,
    requiresClan: true,
    
    async execute(message, args, lang, prefix){
        const scoreRow = (await query(`SELECT * FROM scores WHERE userId = ${message.author.id}`))[0];
        const invitedUser = message.mentions.users.first();
        var demoteMessage = '';

        if(!args.length || invitedUser == undefined){
            return message.reply(lang.errors[1]);
        }

        const invitedScoreRow = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];

        if(!invitedScoreRow){
            return message.reply(lang.errors[0]);
        }
        else if(invitedScoreRow.clanId !== scoreRow.clanId){
            return message.reply('That user is not in your clan.');
        }
        else if(message.author.id == invitedUser.id){
            return message.reply(lang.errors[1]);
        }
        else if(lang.clans.clan_ranks[invitedScoreRow.clanRank].title == 'Recruit'){
            return message.reply(lang.clans.demote[1]);
        }
        else{
            demoteMessage = lang.clans.demote[0].replace('{0}', lang.clans.clan_ranks[invitedScoreRow.clanRank - 1].title).replace('{1}', lang.clans.clan_ranks[invitedScoreRow.clanRank].perms.join('\n'));
        }

        message.channel.send(demoteMessage).then(botMessage => {
            botMessage.react('✅').then(() => botMessage.react('❌'));
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };
            botMessage.awaitReactions(filter, {max: 1, time: 15000, errors: ['time'] }).then(async collected => {
                const reaction = collected.first();

                if(reaction.emoji.name === '✅'){
                    botMessage.delete();

                    const invitedScoreRow2 = (await query(`SELECT * FROM scores WHERE userId = ${invitedUser.id}`))[0];
                    
                    if(invitedScoreRow2.clanId !== invitedScoreRow.clanId || invitedScoreRow2.clanRank !== invitedScoreRow.clanRank || lang.clans.clan_ranks[invitedScoreRow2.clanRank].title == 'Recruit'){
                        return message.channel.send('Error demoting member, try again?');
                    }
                    else{
                        query(`UPDATE scores SET clanRank = ${invitedScoreRow2.clanRank - 1} WHERE userId = ${invitedUser.id}`);
                    }

                    message.reply('Success');
                }
                else{
                    botMessage.delete();
                }
            }).catch(collected => {
                botMessage.delete();
                message.reply(lang.errors[3]);
            });
        });
    },
}