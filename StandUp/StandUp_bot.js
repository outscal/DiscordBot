const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
var schedule = require("node-schedule");

function StandUpscheduler(channelName,hour,min,client) {
  console.log(`scheduled for channel: ${channelName} at ${hour}:${min}` )
  schedule.scheduleJob(`${min} ${hour} * * *`, function () {
    // set time for standup more on https://www.npmjs.com/package/node-schedule
    startStandUp(channelName, client);
    
  });
  
}

function getDataAndSchdule(database, client) {
  database.on("value", function (snapShot) {
    snapShot.forEach((channel) => {
      if (channel.val().IsON) {
        var channelName = channel.key;

        if (channel.val().StandupEveningTime) {
          var time = channel.val().StandupEveningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          //console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          StandUpscheduler(channelName,hour,min,client);
        }

        if (channel.val().StandupMorningTime) {
            var time = channel.val().StandupMorningTime;
            time = time.split(":");
            hour = time[0];
            min = time[1];
           // console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
            StandUpscheduler(channelName,hour,min,client);
          }
      }
    });
  });
}

function startStandUp(channelName, client) {
    console.log("reminder for", channelName);
  const stantUpStartMessage = new MessageEmbed()
    // Set the title of the field
    .setTitle(`Reminder for Daily Standup`)
    // Set the color of the embed
    .setColor(0x16a085)
    // Set the main content of the embed
    .setDescription("start by command 'start'");

  const myGuild = client.guilds.cache.get("736892439868080130");
  myGuild.members.cache.map((user) => {
    if (user.roles.cache.first().name == channelName) {
      user.send(stantUpStartMessage).catch(console.error);
    }
  });
}

function standUpCommands(message, client) {
  const msg = message.content.toLowerCase();
  if (msg == "!channelid") {
    message.reply(message.channel.id);
  }

  if (msg.startsWith("start")) {
    let answers = {
      did: "",
      plan: "",
      problem: "",
    };
    message.channel.send("what you did today");

    const filter = (m) => !m.author.bot;
    // Errors: ['time'] treats ending because of the time limit as an error

    message.channel
      .awaitMessages(filter, { max: 1, time: 60000, errors: ["time"] })
      .then((collected) => {
        answers.did = collected.first().content;
        message.channel.send("What are you planning on doing tomorrow ?");
      })
      .then((collected) => {
        message.channel
          .awaitMessages(filter, { max: 1, time: 60000, errors: ["time"] })
          .then((collected) => {
            answers.plan = collected.first().content;
            message.channel.send("facing any problem ?");
          })
          .then((collected) => {
            message.channel
              .awaitMessages(filter, { max: 1, time: 60000, errors: ["time"] })
              .then((collected) => {
                answers.problem = collected.first().content;
                message.channel.send(
                  "All done! Congrats for maintaining a streak for X days!"
                );

                //message embed
                const myGuild = client.guilds.cache.get("736892439868080130");
                const user = myGuild.members.cache.get(message.author.id);
                const channelName = user.roles.cache.first().name;
                const destinationChannel = myGuild.channels.cache.find(
                  (channel) => channel.name == channelName
                );

                const updateEmbed = new Discord.MessageEmbed()
                  .setColor("#0099ff")
                  .setTitle(`${message.author.username} progress updates`)

                  .addFields(
                    { name: "What did you do today?", value: answers.did },
                    {
                      name: "What are you planning on doing tomorrow?",
                      value: answers.plan,
                    },
                    { name: "Where do you need help?", value: answers.problem }
                  )

                  .setTimestamp();
                destinationChannel.send(updateEmbed);

                //console.log(answers);
              })
              .catch((collected) =>
                message.channel.send(`timeout start again with command "start"`)
              );
          })
          .catch((collected) =>
            message.channel.send(`timeout start again with command "start" `)
          );
      })
      .catch((collected) =>
        message.channel.send(`timeout start again with command "start"`)
      );
  }
}

module.exports = {
  StandUpscheduler,
  standUpCommands,
  getDataAndSchdule,
};
