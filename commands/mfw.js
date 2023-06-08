module.exports = {
    config: {
        name: 'mfw',
        description: 'mfw',
        usage: `!mfw`,
    },
    async run (bot,message,args) {
        return; //temporarily disabled
        message.channel.send("Top 3 mfw");
        let mfw = "";
        for (let i = 0; i < 3; i++) {
            mfw += `${i+1}. mfw\n`;
        }
        message.channel.send(mfw);
    }
}