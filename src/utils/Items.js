
class Items {
    constructor(app){
        this.app = app;
    }

    /**
     * 
     * @param {*} id ID of user to add item to.
     * @param {*} item   Item to add, can be array ex.(["item_box|2","awp|1"])
     * @param {*} amount Amount of item to add, must be number.
     */
    async addItem(id, item, amount){
        if(Array.isArray(item)){
            if(item.length == 0){
                return;
            }
            for(var i = 0; i < item.length; i++){

                // store amounts in array as ["rock|5","ak47|2"] then use split("|")
                let itemToCheck = item[i].split("|");

                // Store id and item in array to bulk insert x times # of items.
                let insertValues = Array(parseInt(itemToCheck[1])).fill([id, itemToCheck[0]]); 

                return await this.app.query(`INSERT INTO user_items (userId, item) VALUES ?`, [insertValues]);
            }
        }
        else{
            let insertValues = Array(parseInt(amount)).fill([id, item]);
            return await this.app.query(`INSERT INTO user_items (userId, item) VALUES ?`, [insertValues]);
        }
    }

    /**
     * 
     * @param {*} id ID of user to remove item from.
     * @param {*} item   Item to remove, can be an array ex.(["rock|2","item_box|3"])
     * @param {*} amount Amount of item to remove.
     */
    async removeItem(id, item, amount){
        if(Array.isArray(item)){
            if(item.length == 0){
                return;
            }
            for(var i=0; i < item.length; i++){

                //store amounts in array as ["rock|5","ak47|2"] then use split("|")
                let itemToCheck = item[i].split("|");

                return await this.app.query(`DELETE FROM user_items WHERE userId = ${id} AND item = '${itemToCheck[0]}' LIMIT ${parseInt(itemToCheck[1])}`);
            }
        }
        else{
            return await this.app.query(`DELETE FROM user_items WHERE userId = ${id} AND item = '${item}' LIMIT ${parseInt(amount)}`);
        }
    }

    /**
     * 
     * @param {*} id ID of user to check.
     * @param {*} item   Item to check user has, can be an array ex.(["awp|1","glock|2"])
     * @param {*} amount Amount of item check for.
     */
    async hasItems(id, item, amount){
        const userItems = await this.getItemObject(id);

        if(Array.isArray(item)){
            if(item.length == 0){
                return true;
            }
            for (var i = 0; i < item.length; i++) {
                //do stuff for each item
                let itemToCheck = item[i].split("|");
                if(userItems[itemToCheck[0]] >= parseInt(itemToCheck[1])){
                    if(i == item.length - 1){
                        return true;
                    }
                }
                else{
                    return false;
                }
            }
        }
        else{
            if(userItems[item] >= parseInt(amount)){
                return true;
            }
            else{
                return false;
            }
        }
    }

    /**
     * 
     * @param {string} id ID of user to check
     * @param {number} amount Amount of items to check if user has space for
     */
    async hasSpace(id, amount = 0){
        const itemCt = await this.getItemCount(id);
        
        console.log((itemCt.itemCt + parseInt(amount)) + " <= " + itemCt.maxCt);

        if((itemCt.itemCt + parseInt(amount)) <= itemCt.maxCt) return true;
        else return false;
    }

    async getItemCount(id, cntTokens = false, cntBanners = false){
        const userItems = await this.getItemObject(id);
        const scoreRow  = await this.app.player.getRow(id);

        let totalItemCt = 0;

        Object.keys(this.app.itemdata).forEach(key => {
            if(userItems[key] > 0){
                if(key == 'token' && cntTokens){
                    totalItemCt += userItems[key];
                }
                else if(this.app.itemdata[key].isBanner && cntBanners){
                    totalItemCt += userItems[key];
                }
                else if(key !== 'token' && !this.app.itemdata[key].isBanner){
                    totalItemCt += userItems[key];
                }
            }
        });

        return {
            itemCt: totalItemCt,
            maxCt: (this.app.config.base_inv_slots + scoreRow.inv_slots),
            capacity: (totalItemCt + "/" + (this.app.config.base_inv_slots + scoreRow.inv_slots))
        }
    }

    /**
     * 
     * @param {*} id User to retrieve items for (in an object format).
     */
    async getItemObject(id){
        const itemRows = (await this.app.query(`SELECT item, COUNT(item) AS amount FROM user_items WHERE userId = "${id}" GROUP BY item`));
        var itemObj = {}
    
        for(var i = 0; i < itemRows.length; i++){
            if(this.app.itemdata[itemRows[i].item]) itemObj[itemRows[i].item] = itemRows[i].amount;
        }
    
        return itemObj;
    }

    /**
     * 
     * @param {string} userId User to get item display for
     * @param {*} options
     * @returns {{onlyBanners:boolean,countBanners:boolean,countLimited:boolean}} Object with array for each item rarity, and value of all items in inventory
     */
    async getUserItems(userId, options = { onlyBanners: false, countBanners: false, countLimited: true }){
        const itemRow = await this.getItemObject(userId);
        let commonItems   = [];
        let uncommonItems = [];
        let rareItems     = [];
        let epicItems     = [];
        let legendItems   = [];
        let ultraItems    = [];
        let limitedItems  = [];
        let invValue      = 0;
        let itemCount     = 0;

        let filteredItems = Object.keys(this.app.itemdata).filter(item => {
            if(options.onlyBanners){
                if(this.app.itemdata[item].isBanner) return true;
                else return false;
            }
            else if(options.countBanners && options.countLimited){
                return true;
            }
            else if(!options.countBanners && options.countLimited){
                if(!this.app.itemdata[item].isBanner) return true;
                else return false;
            }
            else if(options.countBanners && !options.countLimited){
                if(this.app.itemdata[item].isBanner && this.app.itemdata[item].rarity !== 'Limited') return true
                else if(!this.app.itemdata[item].isBanner && this.app.itemdata[item].rarity !== 'Limited') return true
                else return false;
            }
        });

        for(let key of filteredItems){
            if(itemRow[key] >= 1){

                switch(this.app.itemdata[key].rarity){
                    case "Common": commonItems.push(key); break;
                    case "Uncommon": uncommonItems.push(key); break;
                    case "Rare": rareItems.push(key); break;
                    case "Epic": epicItems.push(key); break;
                    case "Legendary": legendItems.push(key); break;
                    case "Ultra": ultraItems.push(key); break;
                    case "Limited": limitedItems.push(key); break;
                }
    
                invValue += this.app.itemdata[key].sell * itemRow[key];
                itemCount+= itemRow[key];
            }
        }
        
        commonItems.sort();
        uncommonItems.sort();
        rareItems.sort();
        epicItems.sort();
        legendItems.sort();
        ultraItems.sort();
        limitedItems.sort();

        commonItems = commonItems.map(item => this.app.itemdata[item].icon + '`' + item + '`' + "(" + itemRow[item] + ")");
        uncommonItems = uncommonItems.map(item => this.app.itemdata[item].icon + '`' + item + '`' + "(" + itemRow[item] + ")");
        rareItems = rareItems.map(item => this.app.itemdata[item].icon + '`' + item + '`' + "(" + itemRow[item] + ")");
        epicItems = epicItems.map(item => this.app.itemdata[item].icon + '`' + item + '`' + "(" + itemRow[item] + ")");
        legendItems = legendItems.map(item => this.app.itemdata[item].icon + '`' + item + '`' + "(" + itemRow[item] + ")");
        ultraItems = ultraItems.map(item => this.app.itemdata[item].icon + '`' + item + '`' + "(" + itemRow[item] + ")");
        limitedItems = limitedItems.map(item => this.app.itemdata[item].icon + '`' + item + '`' + "(" + itemRow[item] + ")");

        return {
            common: commonItems,
            uncommon: uncommonItems,
            rare: rareItems,
            epic: epicItems,
            legendary: legendItems,
            ultra: ultraItems,
            limited: limitedItems,
            invValue: invValue,
            itemCount: itemCount
        }
    }

    /**
     * 
     * @param {*} id User to retrieve badges for (in an array format).
     */
    async getBadges(id){
        const badges = (await this.app.query(`SELECT badge FROM badges WHERE userId = "${id}"`));
        let badgeArr = [];

        for(let badge of badges){
            if(this.app.badgedata[badge.badge]) badgeArr.push(badge.badge);
        }

        return badgeArr;
    }
}

module.exports = Items;