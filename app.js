const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    organization: "org-GBQZyg5M6nypkyHIOlgQegcQ",
    apiKey: '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',
});
const openai = new OpenAIApi(configuration);

const { prefix, token, botid } = require("./config.json");
const { personality, cores } = require("./personality.json");
const { bypass, banned} = require("./users.json");
const maxInput = 150;
const memory = [];
const users = {};
const timeout = 30;
const maxUsagePerXXMinutes = 5;
const Minutes = 60;
const { Client, Intents, Collection } = require('discord.js');
const bot = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ] 
});
setInterval(() => {
    for (const [key, value] of Object.entries(users)) {
        if (value > 0) {
            users[key]--;
        }
    }
}, 1000 * 60);
setInterval(() => {
    for (const [key, value] of Object.entries(users)) {
        if (value < 0) {
            users[key] = 0;
        }
    }
}, 1000 * 60 * Minutes);
const fs = require("fs");

bot.commands = new Collection();

const commandFiles = fs.readdirSync('./commands/').filter(f => f.endsWith('.js'))
for (const file of commandFiles) {
    const props = require(`./commands/${file}`)
    console.log(`${file} loaded`)
    bot.commands.set(props.config.name, props)
}

const commandSubFolders = fs.readdirSync('./commands/').filter(f => !f.endsWith('.js'))

commandSubFolders.forEach(folder => {
    const commandFiles = fs.readdirSync(`./commands/${folder}/`).filter(f => f.endsWith('.js'))
    for (const file of commandFiles) {
        const props = require(`./commands/${folder}/${file}`)
        console.log(`${file} loaded from ${folder}`)
        bot.commands.set(props.config.name, props)
    }
});

// Load Event files from events folder
const eventFiles = fs.readdirSync('./events/').filter(f => f.endsWith('.js'))

for (const file of eventFiles) {
    const event = require(`./events/${file}`)
    if(event.once) {
        bot.once(event.name, (...args) => event.execute(...args, bot))
    } else {
        bot.on(event.name, (...args) => event.execute(...args, bot))
    }
}

//Command Manager
bot.on("messageCreate", async message => {
    //Check if author is a bot or the message was sent in dms and return
    if(message.author.bot) return;
    if(message.channel.type === "dm") return;

    //get prefix from config and prepare message so it can be read as a command
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);

    //Check for prefix
    if(!cmd.startsWith(prefix)) {
        //execute code here if pinged
        if(message.mentions.has(bot.user) && message.channel.name !== "legacy-plus-bot") {
            message.channel.send("mfw");
            return;
        }
        //check if in the channel called #mfw
        if(message.channel.name === "mfw") {
            //check if the first word is mfw
            if (message.content.includes("\n")) {
                message.channel.send("mfw");
                message.delete();
                return;
            }
            
            if((cmd.toLowerCase() === "mfw") /* || (messageArray[0].toLowerCase() === "my" && messageArray[1].toLowerCase() === "face" && messageArray[2].toLowerCase() === "when") */) {
                //react with checkmark
                message.react("✅");
            } else {
                if(message.mentions.users.first()) {
                    message.channel.send("mfw <@" + message.author.id + "> tries to ghost ping " + message.mentions.users.first().username);
                    message.delete();
                } else {
                    message.channel.send("mfw");
                    message.delete();
                }
            }
            
            return;
        }
        else if (message.channel.name === "legacy-plus-bot" && message.mentions.users.first()) {
            if (message.mentions.users.first().id !== botid) return; // only respond to pings of this bot
            if (banned.includes(message.author.id)) return; // don't respond to banned users
            if (users[message.author.id] == null) users[message.author.id] = 0;
            if (message.content.length > maxInput) {
                message.channel.send("I'm sorry <@" + message.author.id + ">, Your message is too long.");
                return;
            }
            if (users[message.author.id] > 0) {
                message.channel.send("I'm sorry <@" + message.author.id + ">, You have to wait " + users[message.author.id] + " minut" + (users[message.author.id] != 1 ? "es" : "e") + " before you can talk to me again.");
                return;
            }
            if (users[message.author.id]-- <= -maxUsagePerXXMinutes && !bypass.includes(message.author.id)) users[message.author.id] = timeout;

            let promptByUser = message.content;
            //filter out any pings
            promptByUser = promptByUser.replace(/<(?:@[!&]?|#)\d+>/g, "");
            memory.push({role: "user", content: promptByUser});


            const chatCompletion = openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                max_tokens: 50,
                messages: getMemory()
            });
            chatCompletion.then(
                (response) => {
                    message.channel.send(response.data.choices[0].message.content);
                    memory.push({role: "assistant", content: response.data.choices[0].message.content});
                }
            ).catch(
                (err) => {
                    message.channel.send("Error.");
                    memory.splice(0,memory.length);
                }
            );
        }
        return;
    } 

    //Get the command from the commands collection and then if the command is found run the command file
    let commandfile = bot.commands.get(cmd.slice(prefix.length));
    if(commandfile) commandfile.run(bot,message,args);

});
function getMemory (memorystrength = 6) {
    const response = [];
    const days = new Date().getFullYear() % 4 == 0 ? 366 : 365;
    response.push({role: "system", content: personality + getRandomCore(days)});
    for (let i = Math.max(0, memory.length - memorystrength); i < memory.length; i++) {
        response.push(memory[i]);
    }
    return response;
}
function getRandomCore (seed = -1) {
    if (seed == -1) seed = (Math.random()*366)|0;
    rand = Math.sin(seed) * 10001 - Math.floor(Math.sin(seed) * 10001);
    console.log(rand * cores.length | 0);
    return cores[rand * cores.length | 0];
}
//Token needed in config.json
bot.login(token);