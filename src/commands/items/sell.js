
module.exports = {
    name: 'sell',
    aliases: [''],
    description: 'Sell items for money.',
    long: 'Sell items for money. Check the `shop` to see how much items can be sold for.',
    args: {"item": "Item to sell.", "amount": "**OPTIONAL** Amount of item to sell."},
    examples: ["sell iron_shield 3"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        let sellItems = app.parse.items(message.args);
        let sellAmounts = app.parse.numbers(message.args);

        if(sellItems.length > 1){
            const userItems = await app.itm.getItemObject(message.author.id);
            let itemAmounts
            let sellPrice = 0;

            try{
                itemAmounts = app.itm.combineItems(getItemList(sellItems, sellAmounts));
            }
            catch(err){
                return message.reply(`❌ You need to specify amounts when bulk selling multiple items! For example: \`${message.prefix}sell rock 1 rpg 3 item_box 2\``);
            }

            for(let i = 0; i < itemAmounts.length; i++){
                let itemAmnt = itemAmounts[i].split('|');

                if(app.itemdata[itemAmnt[0]].sell === ""){
                    return message.reply(`❌ You can't sell ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`'s!`);
                }
                else if(!userItems[itemAmnt[0]]){
                    return message.reply(`❌ You don't have a ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
                }
                else if(userItems[itemAmnt[0]] < itemAmnt[1]){
                    return message.reply(`❌ You only have **${userItems[itemAmnt[0]]}x** ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`);
                }

                sellPrice += app.itemdata[itemAmnt[0]].sell * parseInt(itemAmnt[1]);
            }
            
            const botMessage = await message.reply(`Sell ${app.itm.getDisplay(itemAmounts).join(', ')} for ${app.common.formatNumber(sellPrice)}?`);
            
            try{
                const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                if(confirmed){
                    const userItems2 = await app.itm.getItemObject(message.author.id);

                    for(let i = 0; i < itemAmounts.length; i++){
                        let itemAmnt = itemAmounts[i].split('|');
        
                        if(app.itemdata[itemAmnt[0]].sell === ""){
                            return botMessage.edit(`❌ You can't sell ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`'s!`);
                        }
                        else if(!userItems2[itemAmnt[0]]){
                            return botMessage.edit(`❌ You don't have a ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`)
                        }
                        else if(userItems2[itemAmnt[0]] < itemAmnt[1]){
                            return botMessage.edit(`❌ You only have **${userItems2[itemAmnt[0]]}x** ${app.itemdata[itemAmnt[0]].icon}\`${itemAmnt[0]}\`.`);
                        }
                    }

                    const row = await app.player.getRow(message.author.id);
                    app.itm.removeItem(message.author.id, itemAmounts);
                    app.player.addMoney(message.author.id, sellPrice);

                    botMessage.edit(`Successfully sold ${app.itm.getDisplay(itemAmounts).join(', ')} for ${app.common.formatNumber(sellPrice)}.\n\nYou now have ${app.common.formatNumber(row.money + sellPrice)}.`);
                }
                else{
                    botMessage.delete();
                }
            }
            catch(err){
                botMessage.edit("You didn't react in time.");
            }
        }
        else if(sellItems[0]){
            let sellItem = sellItems[0];
            let sellAmount = sellAmounts[0] || 1;

            const userItems = await app.itm.getItemObject(message.author.id);
            const hasItems = await app.itm.hasItems(userItems, sellItem, sellAmount);
            let itemPrice = app.itemdata[sellItem].sell;
            
            if(!hasItems){
                return message.reply(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`);
            }
            
            if(itemPrice !== ""){
                if(sellAmount > 30){
                    sellAmount = 30;
                }

                const botMessage = await message.reply(`Sell ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for ${app.common.formatNumber(itemPrice * sellAmount)}?`);
                
                try{
                    const confirmed = await app.react.getConfirmation(message.author.id, botMessage);

                    if(confirmed){
                        const userItems = await app.itm.getItemObject(message.author.id);
                        const hasItems = await app.itm.hasItems(userItems, sellItem, sellAmount);

                        if(hasItems){
                            const row = await app.player.getRow(message.author.id);

                            app.player.addMoney(message.author.id, parseInt(itemPrice * sellAmount));
                            app.itm.removeItem(message.author.id, sellItem, sellAmount);
                            botMessage.edit(`Successfully sold ${sellAmount}x ${app.itemdata[sellItem].icon}\`${sellItem}\` for ${app.common.formatNumber(itemPrice * sellAmount)}.\n\nYou now have ${app.common.formatNumber(row.money + (itemPrice * sellAmount))}.`);
                        }
                        else{
                            botMessage.edit(userItems[sellItem] ? `❌ You don't have enough of that item! You have **${userItems[sellItem]}x** ${app.itemdata[sellItem].icon}\`${sellItem}\`.` : `❌ You don't have a ${app.itemdata[sellItem].icon}\`${sellItem}\`.`);
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
                message.reply("❌ You can't sell that item!");
            }
        }
        else{
            message.reply(`You need to enter a valid item to sell! \`${message.prefix}sell <item> <amount>\``);
        }
    },
}

function getItemList(items, amounts){
    let itemList = [];

    for(let i = 0; i < items.length; i++){
        let sellItem = items[i];
        let sellAmount = amounts[i];

        if(!sellAmount) throw 'No amount specified';

        if(sellAmount > 30) sellAmount = 30;

        itemList.push(sellItem + '|' + sellAmount);
    }

    return itemList;
}