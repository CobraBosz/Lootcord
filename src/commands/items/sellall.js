const { RARITIES } = require('../../resources/constants');

module.exports = {
    name: 'sellall',
    aliases: [''],
    description: 'Sell multiple items at once.',
    long: 'Sell all items of a certain rarity. If no rarity is specified, it will sell all items in your inventory.',
    args: {"rarity": "**OPTIONAL** Rarity of items you want to sell ie. common, rare..."},
    examples: ["sellall rare"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let sellItem = message.args[0] || '';

        if(Object.keys(RARITIES).includes(sellItem.toLowerCase())){
            let commonTotal = 0;
            let totalAmount = 0;
            
            // filter items by rarity and exclude banners
            let itemsToCheck = Object.keys(app.itemdata).filter(item => {
                return app.itemdata[item].rarity.toLowerCase() === sellItem.toLowerCase() && !app.itemdata[item].isBanner
            });

            if(itemsToCheck.length < 1){
                return message.reply(`You need to enter a valid type to sell! \`${message.prefix}sellall <rarity>\``);
            }
            
            const itemRow = await app.itm.getItemObject(message.author.id);
            //iterate array and sell
            for (var i = 0; i < itemsToCheck.length; i++) {
                if(itemRow[itemsToCheck[i]] >= 1){
                    totalAmount += itemRow[itemsToCheck[i]];
                    commonTotal += (itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                }
            }
            if(totalAmount <= 0){
                return message.reply("❌ You don't have any items of that quality.");
            }

            const sellallEmbed = new app.Embed()
            .setDescription(`Sell ${totalAmount}x ${RARITIES[sellItem.toLowerCase()].name} items for ${app.common.formatNumber(commonTotal)}?`)
            .setColor(RARITIES[sellItem.toLowerCase()].color)

            const botMessage = await message.channel.createMessage({content: '<@' + message.author.id + '>', embed: sellallEmbed.embed});
            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    const itemRow2 = await app.itm.getItemObject(message.author.id);

                    let testAmount = 0; // used to verify user didnt alter inventory while selling.
                    let testTotalItems = 0;
                    for (var i = 0; i < itemsToCheck.length; i++){
                        if(itemRow2[itemsToCheck[i]] >= 1){
                            testTotalItems += itemRow2[itemsToCheck[i]];
                            testAmount += (itemRow2[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                        }
                    }
                    
                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                        const row = await app.player.getRow(message.author.id);

                        for (var i = 0; i < itemsToCheck.length; i++) {
                            if(itemRow2[itemsToCheck[i]] !== undefined) await app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]]);
                        }
                        await app.player.addMoney(message.author.id, parseInt(commonTotal));

                        sellallEmbed.setDescription(`Successfully sold all ${RARITIES[sellItem.toLowerCase()].name} quality items.\n\nYou now have ${app.common.formatNumber(row.money + commonTotal)}.`);
                        botMessage.edit(sellallEmbed);
                    }
                    else{
                        sellallEmbed.setDescription('❌ Sellall failed. Your inventory was altered during the sale.');
                        botMessage.edit(sellallEmbed);
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                sellallEmbed.setDescription('❌ Command timed out.');
                botMessage.edit(sellallEmbed);
            }
        }
        else if(sellItem == ''){
            let commonTotal = 0;
            let totalAmount = 0;

            // filter out limited items and banners
            let itemsToCheck = Object.keys(app.itemdata).filter(item => {
                return app.itemdata[item].rarity !== 'Limited' && !app.itemdata[item].isBanner
            });

            const itemRow = await app.itm.getItemObject(message.author.id);

            for (var i = 0; i < itemsToCheck.length; i++) {
                if(itemRow[itemsToCheck[i]] >= 1){
                    totalAmount += itemRow[itemsToCheck[i]];
                    commonTotal += (itemRow[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                }
            }

            if(totalAmount <= 0){
                return message.reply("❌ You don't have any items you can sell.");
            }

            const botMessage = await message.reply(`Sell ${totalAmount}x items for ${app.common.formatNumber(commonTotal)}?`);

            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    const itemRow2 = await app.itm.getItemObject(message.author.id);

                    let testAmount = 0;
                    let testTotalItems = 0;
                    for (var i = 0; i < itemsToCheck.length; i++) {
                        if(itemRow2[itemsToCheck[i]] >= 1){
                            testTotalItems += itemRow2[itemsToCheck[i]];
                            testAmount += (itemRow2[itemsToCheck[i]] * app.itemdata[itemsToCheck[i]].sell);
                        }
                    }
                    
                    if(testTotalItems == totalAmount && testAmount == commonTotal){
                        for (var i = 0; i < itemsToCheck.length; i++) {
                            if(itemRow2[itemsToCheck[i]] !== undefined) await app.itm.removeItem(message.author.id, itemsToCheck[i], itemRow2[itemsToCheck[i]]);
                        }
                        const row = await app.player.getRow(message.author.id);

                        await app.player.addMoney(message.author.id, parseInt(commonTotal));

                        botMessage.edit(`Successfully sold all items.\n\nYou now have ${app.common.formatNumber(row.money + commonTotal)}.`);
                    }
                    else{
                        botMessage.edit('❌ Sellall failed. Your inventory was altered during the sale.');
                    }
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit("You didn't react in time.");
            }
        }
        else{
            message.reply('You need to enter a valid item rarity to sell! Ex. `sellall epic`');
        }
    },
}