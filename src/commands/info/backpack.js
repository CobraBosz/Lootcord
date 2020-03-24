
module.exports = {
    name: 'backpack',
    aliases: ['bp'],
    description: 'View your currently equipped backpack and stats.',
    long: 'Shows currently equipped backpack and current inventory space.',
    args: {},
    examples: ["backpack"],
    ignoreHelp: false,
    requiresAcc: true,
    requiresActive: false,
    guildModsOnly: false,
    
    async execute(app, message){
        const row = await app.player.getRow(message.author.id);
        const itemCt = await app.itm.getItemCount(message.author.id);
        
        if(row.backpack !== "none"){
            message.reply("\n**Backpack equipped:** " + app.itemdata[row.backpack].icon + "`" + row.backpack + "`\n**Inventory space:** `" + itemCt.capacity + "` (base " + (app.config.base_inv_slots + (5 * row.prestige)) + " ***+" + app.itemdata[row.backpack].inv_slots + "***)\nIncrease space by equipping a better backpack!");
        }
        else{
            message.reply("\n**Backpack equipped:** " + "`" + row.backpack + "`\n**Inventory space:** `" + itemCt.capacity + "`\nIncrease space by equipping a better backpack!");
        }
    },
}