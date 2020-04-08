const MILLISECONDS_MONTH = 2592000 * 1000;

exports.handle = async function({ data }){
    const donateEmbed = new this.Embed()
    .setTitle('Ko-fi Donation')
    .setThumbnail('https://pbs.twimg.com/profile_images/1207570720034701314/dTLz6VR2_400x400.jpg')
    .setColor('#29ABE0')

    try{
        data = JSON.parse(data);
        let user = data.message.split(/ +/).map(val => val.match(/^<?@?!?[0-9]{17,18}>?$/)).filter(val => val);
    
        if(!user.length){
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ No user in message')

            return this.messager.messageLogs(donateEmbed);
        }
    
        user = user[0][0];
        const months = Math.floor(parseInt(data.amount) / 3);
    
        if(!months){
            donateEmbed.addField('User', '```fix\n' + user + '```', true)
            donateEmbed.addField('Message', data.message)
            .setFooter('❌ 0 months')

            return this.messager.messageLogs(donateEmbed);
        }
    
        const patronCD = await this.cd.getCD(user, 'patron');
    
        const patronEmbed = new this.Embed()
        .setTitle('😲 a donator!')
        .setFooter('💙 blobfysh')
        .setColor('#29ABE0')
    
        if(patronCD){
            const patronRemaining = await this.cache.getTTL(`patron|${user}`);
    
            patronEmbed.setDescription(`Thank you for helping me create Lootcord!!\n\nYour premium perks were extended for \`${months} months\`!`);
    
            this.itm.addItem(user, 'patron', 1);
            await this.query(`DELETE FROM cooldown WHERE userId = '${user}' AND type = 'patron'`);
            await this.cd.setCD(user, 'patron', (MILLISECONDS_MONTH * months) + (patronRemaining * 1000), { patron: true });
        }
        else{
            patronEmbed.setDescription(`Thank you for helping me create Lootcord!!\n\nYour account has been given premium perks for \`${months} months\`!`);
            await this.cd.setCD(user, 'patron', MILLISECONDS_MONTH * months, { patron: true });
        }
    
        try{
            this.common.messageUser(user, patronEmbed, { throwErr: true });

            donateEmbed.addField('User', '```fix\n' + user + '```', true)
            donateEmbed.addField('Months', '```\n' + months + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('✅ Success')

            this.messager.messageLogs(donateEmbed);
        }
        catch(err){
            donateEmbed.addField('User', '```fix\n' + user + '```', true)
            donateEmbed.addField('Months', '```\n' + months + '```', true)
            donateEmbed.addField('Message', data.message)
            donateEmbed.setFooter('❌ Failed to send message to user')

            this.messager.messageLogs(donateEmbed);
        }
    }
    catch(err){
        console.warn(err);
    }
}