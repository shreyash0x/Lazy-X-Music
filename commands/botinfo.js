const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config.js');
const musicIcons = require('../UI/icons/musicicons.js');

module.exports = {
    name: "botinfo",
    description: "Get bot information with dropdown menu",
    permissions: "0x0000000000000800",
    options: [],
    run: async (client, interaction, lang) => {
        try {
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
                .setFooter({ text: `Made with ${musicIcons.heartIcon} by Shreyash0x ( Shadow )`, iconURL: musicIcons.heartIcon })
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
                        label: '👨‍💻 Developer Info',
                        description: 'Information about the developer',
                        value: 'developer'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const message = await interaction.reply({ 
                embeds: [homeEmbed], 
                components: [row],
                fetchReply: true
            });

            const collector = message.createMessageComponentCollector({ time: 300000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '❌ This menu is not for you!', ephemeral: true });
                }

                await i.deferUpdate();

                if (i.values[0] === 'home') {
                    await i.editReply({ embeds: [homeEmbed] });
                } else if (i.values[0] === 'developer') {
                    const devEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle('👨‍💻 Developer Information')
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`
                        **👨💻 Developer:** Shreyash0x ( Shadow )
                        **🎯 Role:** Head Developer
                        
                        **💡 About:**
                        Passionate developer specializing in Discord music bots and entertainment systems.
                        `)
                        .addFields(
                            { name: '🎵 Project', value: 'Lazy X Music', inline: true },
                            { name: '⭐ Focus', value: 'High-Quality Audio', inline: true }
                        )
                        .setFooter({ text: `Made with ${musicIcons.heartIcon} by Shreyash0x ( Shadow )`, iconURL: musicIcons.heartIcon })
                        .setTimestamp();

                    await i.editReply({ embeds: [devEmbed] });
                }
            });

            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
                    );
                message.edit({ components: [disabledRow] }).catch(() => {});
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ An error occurred while fetching bot information.', 
                ephemeral: true 
            });
        }
    }
};