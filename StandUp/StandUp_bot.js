const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
var schedule = require("node-schedule");
const { database } = require("firebase-admin");
const { LeaderBoard } = require("../Response/BotCammands");

function getDataAndSchdule(db, client) {
  var database = db.ref("/StandupConfig");
  database.on("value", function (snapShot) {
    snapShot.forEach((channel) => {
      if (channel.val().IsON) {
        // checking for channel has active standup
        var channelName = channel.key;

        if (channel.val().StandupEveningTime) {
          var time = channel.val().StandupEveningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          //console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          StandUpscheduler(channelName, hour, min, client);
        }

        if (channel.val().StandupMorningTime) {
          var time = channel.val().StandupMorningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          // console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          StandUpscheduler(channelName, hour, min, client);
        }
      }
    });
  });
}

function StandUpscheduler(channelName, hour, min, client) {
  //console.log(`scheduled for channel: ${channelName} at ${hour}:${min}` )
  schedule.scheduleJob(`${min} ${hour} * * *`, function () {
    // set time for standup more on https://www.npmjs.com/package/node-schedule
    startStandUp(channelName, client);
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
  var serverID = "736892439868080130";
  const myGuild = client.guilds.cache.get(serverID);
  myGuild.members.cache.map((user) => {
    if (user.roles.cache.first().name == channelName) {
      user.send(stantUpStartMessage).catch(console.error);
    }
  });
}

function standUpCommands(message, client, db) {
  var dialyStandUpDB = db.ref("/daily_standups");

  const msg = message.content.toLowerCase();

  //   if (msg == "!channelid") {
  //     message.reply(message.channel.id);
  //     console.log(dialyStandUpDB.key);
  //     // saveToDataBase(dialyStandUpDB);
  //   }

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

                //message embed

                const myGuild = client.guilds.cache.get("736892439868080130");
                const user = myGuild.members.cache.get(message.author.id);
                const channelName = user.roles.cache.first().name; // picking the rolename as rolename and channel name is same
                const destinationChannel = myGuild.channels.cache.find(
                  (channel) => channel.name == channelName
                );
                const channel = destinationChannel; // pass this to calculate leaderboard score
                const student = message.author; // pass this to calculate leaderboard score
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

                // call the leaderboard function here with arg(channel,student){
                //     inside this calculate the LeaderBoard score and put on dm

                //     message : All done! Congrats for maintaining a streak for X days!"
                // }

                saveToDataBase(dialyStandUpDB, channel, student, answers); // saving the standup answers to db
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

function saveToDataBase(dialyStandUpDB, channel, student, answers) {
  var channelID = channel.id;
  var studentID = student.id;
  var date = get_Date();
  var dailyStandUp = dialyStandUpDB.child(date);

  if (dailyStandUp.key != date) {
    dialyStandUpDB.set(date);
    dailyStandUp = dialyStandUpDB.child(date);
  }
  var channelNode = dailyStandUp.child(channelID);
  if (channelNode.key != channelNode) {
    dailyStandUp.set(channelID);
    channelNode = dailyStandUp.child(channelID);
  }

  var studentNode = channelNode.child(studentID);

  if (studentNode.key != studentNode) {
    channelNode.set(studentID);
    studentNode = channelNode.child(studentID);
  }

  channelNode.child(studentID).update({
    q1: answers.did,
    q2: answers.plan,
    q3: answers.problem,
  });
}

function get_Date() {
  var D = new Date();
  let day = D.getDate().toString();
  let month = (D.getMonth() + 1).toString();
  let year = D.getFullYear().toString();

  let date = year + month + day;
  console.log(month);
  return date;
}

module.exports = {
  StandUpscheduler,
  standUpCommands,
  getDataAndSchdule,
};
