const { EmbedBuilder } = require('discord.js');
const { autoplayCollection } = require('../mongodb.js');
const config = require('../config.js');
const musicIcons = require('../UI/icons/musicicons.js');

module.exports = {
    name: 'autoplay',
    description: 'Toggle autoplay for the current guild',
    permissions: '0x0000000000000800',
    options: [],
    run: async (client, interaction, lang) => {
        const guildId = interaction.guildId;
        if (!guildId) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        try {
            const autoplaySetting = await autoplayCollection.findOne({ guildId });
            const newAutoplayState = !autoplaySetting?.autoplay;

            await autoplayCollection.updateOne(
                { guildId },
                { $set: { autoplay: newAutoplayState } },
                { upsert: true }
            );

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setAuthor({ 
                    name: newAutoplayState ? lang.autoplay.embed.enabled : lang.autoplay.embed.disabled,
                    iconURL: musicIcons.autoplayIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error toggling autoplay:', error);
            await interaction.reply({ content: 'An error occurred while toggling autoplay.', ephemeral: true });
        }
    },
};
