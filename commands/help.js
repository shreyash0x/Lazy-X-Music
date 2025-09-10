const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require("../config.js");
const musicIcons = require('../UI/icons/musicicons.js');

module.exports = {
  name: "help",
  description: "Get information about the bot",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction, lang) => {
    try {
      const botName = client.user.username;

      const commandsPath = path.join(__dirname, "../commands");
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      const totalCommands = commandFiles.length;

      const totalServers = client.guilds.cache.size;
      const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

      const uptime = process.uptime();
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const ping = client.ws.ping;

      // Build initial list with General group by default
      const initialFiltered = commandFiles.filter(f => ['help','ping','support'].includes(require(path.join(commandsPath, f)).name));
      const initialValue = initialFiltered.map(file => {
        const command = require(path.join(commandsPath, file));
        return `\`/${command.name}\` - ${command.description || lang.help.embed.noDescription}`;
      }).join('\n') || lang.help.embed.noCommands;

      const embed = new EmbedBuilder()
        .setColor(config.embedColor || "#7289DA")
        .setTitle(lang.help.embed.title.replace("{botName}", botName))
        .setAuthor({
          name: lang.help.embed.author,
          iconURL: musicIcons.alertIcon,
          url: config.SupportServer
        })
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setDescription(lang.help.embed.description
          .replace("{botName}", botName)
          .replace("{totalCommands}", totalCommands)
          .replace("{totalServers}", totalServers)
          .replace("{totalUsers}", totalUsers)
          .replace("{uptimeString}", uptimeString)
          .replace("{ping}", ping)
        )
        .addFields({ name: lang.help.embed.availableCommands, value: initialValue })
        .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
        .setTimestamp();

      const categories = [
        { label: 'General', value: 'general' },
        { label: 'Music', value: 'music' },
        { label: 'Playlist', value: 'playlist' }
      ];

      const menu = new StringSelectMenuBuilder()
        .setCustomId('help-select')
        .setPlaceholder('Select a category')
        .addOptions(categories);

      const row = new ActionRowBuilder().addComponents(menu);

      const message = await interaction.reply({ embeds: [embed], components: [row] });

      const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000, filter: i => i.user.id === interaction.user.id });

      collector.on('collect', async (i) => {
        const selected = i.values[0];
        let filtered = commandFiles;
        if (selected === 'music') {
          filtered = commandFiles.filter(f => ['play','pause','resume','skip','stop','queue','np','volume','filters','autoplay','shuffle'].includes(require(path.join(commandsPath, f)).name));
        } else if (selected === 'playlist') {
          filtered = commandFiles.filter(f => ['createplaylist','deleteplaylist','addsong','deletesong','myplaylists','showsongs','playcustomplaylist','allplaylists'].includes(require(path.join(commandsPath, f)).name));
        } else if (selected === 'general') {
          filtered = commandFiles.filter(f => ['help','ping','support'].includes(require(path.join(commandsPath, f)).name));
        }

        const value = filtered.map(file => {
          const command = require(path.join(commandsPath, file));
          return `\`/${command.name}\` - ${command.description || lang.help.embed.noDescription}`;
        }).join('\n') || lang.help.embed.noCommands;

        const updated = EmbedBuilder.from(embed).setFields({ name: lang.help.embed.availableCommands, value });
        await i.update({ embeds: [updated] });
      });

      collector.on('end', async () => {
        try { await message.edit({ components: [] }); } catch (_) {}
      });
      return;
    } catch (e) {
      console.error(e);
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({ content: lang.help.embed.error, ephemeral: true });
      } else {
        return interaction.reply({ content: lang.help.embed.error, ephemeral: true });
      }
    }
  },
};