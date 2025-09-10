const config = require("../config.js");
const { InteractionType } = require('discord.js');
const fs = require("fs");
const path = require("path");

module.exports = async (client, interaction) => {
  try {
    if (!interaction?.guild) {
      return interaction?.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    const languageFile = path.join(__dirname, `../languages/${config.language}.js`);
    const lang = require(languageFile);

    function cmd_loader() {
      if (interaction?.type === InteractionType.ApplicationCommand) {
        fs.readdir(config.commandsDir, (err, files) => {
          if (err) throw err;
          files.forEach(async (f) => {
            let props = require(`.${config.commandsDir}/${f}`);
            if (interaction.commandName === props.name) {
              try {
                if (interaction?.member?.permissions?.has(props?.permissions || "0x0000000000000800")) {
                  return props.run(client, interaction, lang);
                } else {
                  return interaction?.reply({ content: lang.errors.noPermission, ephemeral: true });
                }
              } catch (e) {
                try {
                  const errorMessage = lang.errors.generalError.replace("{error}", e.message);
                  if (interaction?.replied || interaction?.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                  } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                  }
                } catch (_) {
                  // swallow secondary errors to avoid unhandled rejections
                }
              }
            }
          });
        });
      }
    }

    cmd_loader();
  } catch (e) {
    console.error(e);
  }
};
