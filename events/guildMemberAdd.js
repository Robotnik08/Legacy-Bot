module.exports = {
    name: 'guildMemberAdd',
    execute(member, bot) {
        return; //unused
        //Log the newly joined member to console
        console.log('User ' + member.user.tag + ' has joined the server!');

        //Find a channel named welcome and send a Welcome message
        member.guild.channels.cache.find(c => c.name === "mfw").send('mfw');
    }
}