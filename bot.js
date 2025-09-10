const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require('path');
const { initializePlayer } = require('./player');
const { connectToDatabase } = require('./mongodb');
const colors = require('./UI/colors/colors');
require('dotenv').config();

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});

client.config = config;
initializePlayer(client);

client.on("ready", () => {
    console.log(`${colors.cyan}[ SYSTEM ]${colors.reset} ${colors.green}Client logged as ${colors.yellow}${client.user.tag}${colors.reset}`);
    console.log(`${colors.cyan}[ MUSIC ]${colors.reset} ${colors.green}Riffy Music System Ready 🎵${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace('T', ' ').split('.')[0]}${colors.reset}`);
    client.riffy.init(client.user.id);
});
client.config = config;

fs.readdir("./events", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0]; 
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});


client.commands = [];
fs.readdir(config.commandsDir, (err, files) => {
  if (err) throw err;
  files.forEach(async (f) => {
    try {
      if (f.endsWith(".js")) {
        let props = require(`${config.commandsDir}/${f}`);
        client.commands.push({
          name: props.name,
          description: props.description,
          options: props.options,
        });
      }
    } catch (err) {
      console.log(err);
    }
  });
});


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.mentions.has(client.user)) {
        const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
        const musicIcons = require('./UI/icons/musicicons.js');
        
        const totalServers = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const uptime = process.uptime();
        const days = Math.floor(uptime / (3600 * 24));
        const hours = Math.floor((uptime % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        const ping = client.ws.ping;

        const homeEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`🤖 ${client.user.username} Bot Information`)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`
            **📊 Bot Statistics:**
            • **Prefix:** \`/\` (Slash Commands)
            • **Ping:** ${ping}ms
            • **Uptime:** ${uptimeString}
            • **Servers:** ${totalServers}
            • **Users:** ${totalUsers}
            
            **🎵 Music Features:**
            • YouTube, Spotify, SoundCloud support
            • High-quality audio playback
            • Queue management & controls
            `)
            .setFooter({ text: `Made with ❤️ by Lazy X Development Team`, iconURL: musicIcons.heartIcon })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('botinfo_menu')
            .setPlaceholder('📋 Select an option...')
            .addOptions([
                {
                    label: '🏠 Home',
                    description: 'Bot statistics and information',
                    value: 'home'
                },
                {
                    label: '👨💻 Developer Info',
                    description: 'Information about the developer',
                    value: 'developer'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const msg = await message.reply({ 
            embeds: [homeEmbed], 
            components: [row]
        });

        const collector = msg.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: '❌ This menu is not for you!', ephemeral: true });
            }

            await i.deferUpdate();

            if (i.values[0] === 'home') {
                await i.editReply({ embeds: [homeEmbed] });
            } else if (i.values[0] === 'developer') {
                const devEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle('👨💻 Developer Information')
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`
                    **👨‍💻 Developer:** Shreyash0x ( Shadow )
                    **🎯 Role:** Head Developer
                    
                    **💡 About:**
                    Passionate developer specializing in Discord music bots and entertainment systems.
                    `)
                    .addFields(
                        { name: '🎵 Project', value: 'Lazy X Music', inline: true },
                        { name: '⭐ Focus', value: 'High-Quality Audio', inline: true }
                    )
                    .setFooter({ text: `Made with ❤️ by Lazy X Development Team`, iconURL: musicIcons.heartIcon })
                    .setTimestamp();

                await i.editReply({ embeds: [devEmbed] });
            }
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
                );
            msg.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
});

client.on("raw", (d) => {
    const { GatewayDispatchEvents } = require("discord.js");
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}🔐 TOKEN VERIFICATION${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ TOKEN ]${colors.reset} ${colors.red}Authentication Failed ❌${colors.reset}`);
  console.log(`${colors.gray}Error: Turn On Intents or Reset New Token${colors.reset}`);
});
connectToDatabase().then(() => {
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}🕸️  DATABASE STATUS${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.green}MongoDB Online ✅${colors.reset}`);
}).catch((err) => {
  console.log('\n' + '─'.repeat(40));
  console.log(`${colors.magenta}${colors.bright}🕸️  DATABASE STATUS${colors.reset}`);
  console.log('─'.repeat(40));
  console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.red}Connection Failed ❌${colors.reset}`);
  console.log(`${colors.gray}Error: ${err.message}${colors.reset}`);
});

const express = require("express");
const app = express();
const port = 3000;
app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath);
});

app.listen(port, () => {
    console.log('\n' + '─'.repeat(40));
    console.log(`${colors.magenta}${colors.bright}🌐 SERVER STATUS${colors.reset}`);
    console.log('─'.repeat(40));
    console.log(`${colors.cyan}[ SERVER ]${colors.reset} ${colors.green}Online ✅${colors.reset}`);
    console.log(`${colors.cyan}[ PORT ]${colors.reset} ${colors.yellow}http://localhost:${port}${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace('T', ' ').split('.')[0]}${colors.reset}`);
    console.log(`${colors.cyan}[ USER ]${colors.reset} ${colors.yellow}Shadow${colors.reset}`);
});
