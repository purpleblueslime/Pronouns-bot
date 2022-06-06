const Discord = require('discord.js'),
  { MongoClient } = require('mongodb'),
  sharp = require('sharp'),
  axios = require('axios'),
  bot = new Discord.Client({ 
    intents: [Discord.Intents.FLAGS.GUILDS] 
  }),
  Mongo = new MongoClient(process.env.MongoUrl);

bot.on('ready', () => {
  setInterval (() => {
    bot.user.setActivity(`/pronouns in ${bot.guilds.cache.size} servers`, {type : 'LISTENING'} );
  },60000);
  console.log('Online');
});

bot.on('interactionCreate', async interaction => {

  if (!interaction.isCommand()) return;

  if (interaction.commandName == 'update') {
    var users = Mongo.db('Pronouns').collection('Users')
      filter = { 
        _id: interaction.user.id 
      },
      options = { 
        upsert: true 
      },
      update = {
        $set: {
          pronouns: interaction.options.getString('pronouns')
        }
      };

    users.updateOne(filter, update, options);
    await interaction.reply({ 
      content: '✅', 
      ephemeral: true 
    });
  }

  else if (interaction.commandName == 'pronouns') {
    try {
      var discordUser = (interaction.options.getUser('user') || interaction.user),
      users = Mongo.db('Pronouns').collection('Users'),
      query = { 
        _id: discordUser.id 
      },
      user = await users.findOne(query);
      if (!user) throw '';
    }
    catch {
      var user = { 
        pronouns: 'rather-not-say' 
      };
    }
    finally {
      var avatar = await axios({ 
        url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=1024`, 
        responseType: 'arraybuffer' 
      });
  
      avatar = sharp(avatar.data);
      avatar
      .resize(460, 460)
      .composite([{ input: `./assets/${user.pronouns}.png`, top: 0, left: 0, blend: 'over' }])
      .toBuffer(async (e, data) => {
        var attachment = new Discord.MessageAttachment(data, 'user.png');
        await interaction.reply({
          files: [attachment]
        });
      });
    };
  };
});

bot.login(process.env.token);
Mongo.connect();
