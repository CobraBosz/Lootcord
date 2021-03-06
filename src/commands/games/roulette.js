
module.exports = {
    name: 'roulette',
    aliases: [''],
    description: 'Play a game of Russian roulette.',
    long: 'Play a game of Russian roulette.\nIf you survive, you win **1.2x** what you bet.\nIf you lose, you\'ll be shot for **50** damage and lose your bet amount.',
    args: {"amount": "Amount of money to gamble."},
    examples: ["roulette 1000"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: true,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const rouletteCD = await app.cd.getCD(message.author.id, 'roulette');
        let gambleAmount = app.parse.numbers(message.args)[0];

        if(!gambleAmount && message.args[0] && message.args[0].toLowerCase() === 'all'){
            gambleAmount = row.money >= 1000000 ? 1000000 : row.money;
        }
        
        if(rouletteCD){
            return message.reply(`You need to wait  \`${rouletteCD}\`  before using this command again.`);
        }
        
        if(row.health < 25){
            return message.reply(`⚠ You need at least **25 HP** to use the \`roulette\` command, you currently have ${app.player.getHealthIcon(row.health, row.maxHealth)} **${row.health} / ${row.maxHealth}**.`);
        }

        if(!gambleAmount || gambleAmount < 100){
            return message.reply(`Please specify an amount of at least ${app.common.formatNumber(100)} to gamble!`);
        }

        if(gambleAmount > row.money){
            return message.reply(`You don't have that much money! You currently have ${app.common.formatNumber(row.money)}`);
        }
        
        if(gambleAmount > 1000000){
            return message.reply(`You cannot gamble more than ${app.common.formatNumber(1000000)}`);
        }
        
        await app.player.removeMoney(message.author.id, gambleAmount);
        
        let multiplier = 1.2;
        let winnings = Math.floor(gambleAmount * multiplier);
        let chance = Math.floor(Math.random() * 100); //return 1-100

        if(chance <= 20){
            let healthDeduct = 50;

            if(row.health <= 50){
                healthDeduct = row.health - 1;

                await app.mysql.update('scores', 'health', 1, 'userId', message.author.id);
            }
            else{
                await app.mysql.updateDecr('scores', 'health', 50, 'userId', message.author.id);
            }

            message.reply("***Click***").then(msg => {
                setTimeout(() => {
                    msg.edit(`<@${message.author.id}>, 💥 The gun fires! You took *${healthDeduct}* damage and now have **${row.health - healthDeduct} health**. Oh, and you also lost ${app.common.formatNumber(gambleAmount)}`);
                }, 1500);
            });
        }
        else{
            await app.player.addMoney(message.author.id, winnings);

            message.reply("***Click***").then(msg => {
                setTimeout(() => {
                    msg.edit(`<@${message.author.id}>, You survived! Your winnings are: ${app.common.formatNumber(winnings)}`);
                }, 1500);
            });
        }

        await app.cd.setCD(message.author.id, 'roulette', 1000 * app.config.cooldowns.roulette);
    },
}