const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
var schedule = require("node-schedule");
const { database } = require("firebase-admin");
const { LeaderBoard } = require("../Response/BotCammands");

const message1 = "What did you do today?";
const message2 = "What are you planning on doing tomorrow?";
const message3 = "Do you need any help?";
const message4 = "Thanks for submitting your update!";
const messageTimeout = `Timed out! Please start again using the "start" command`;


function getDataAndSchdule(db, client, guild) {
  var database = db.ref("/StandupConfig");
  database.on("value", function (snapShot) {
    snapShot.forEach((channel) => {
      if (channel.val().IsON) {  // checking for channel has active standup 
        var channelName = channel.key;

        if (channel.val().StandupEveningTime) {
          var time = channel.val().StandupEveningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          //console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          StandUpscheduler(channelName, hour, min, client, guild);
        }

        if (channel.val().StandupMorningTime) {
          var time = channel.val().StandupMorningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          // console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          StandUpscheduler(channelName, hour, min, client, guild);
        }
      }
    });
  });
}

function StandUpscheduler(channelName, hour, min, client, guild) {
  //console.log(`scheduled for channel: ${channelName} at ${hour}:${min}` )
  schedule.scheduleJob(`${min} ${hour} * * *`, function () {
    startStandUp(channelName, client, guild);
  });
}

function startStandUp(channelName, client, guild) {
  console.log("reminder for", channelName);
  const stantUpStartMessage = new MessageEmbed()
    .setTitle(`Reminder for Daily Standup`)
    .setColor(0x16a085)
    .setDescription("start by command 'start'");

  // const myGuild = client.guilds.cache.get(serverID); 
  guild.members.cache.map((user) => {
    if (user.roles.cache.first().name == channelName) {
      user.send(stantUpStartMessage).catch(console.error);
    }
  });
}

function standUpCommands(message, client, guild, db) {
  var dialyStandUpDB = db.ref("/daily_standups");
  const msg = message.content.toLowerCase();

  // TODO need safety checks - what is the user starts the standup message with the word "start"?
  if (msg.startsWith("start") && message.channel.type == "dm") {
    let answers = {
      did: "",
      plan: "",
      problem: ""
    };

    message.channel.send(message1);
    const filter = (m) => !m.author.bot;
    // Errors: ['time'] treats ending because of the time limit as an error

    message.channel
      .awaitMessages(filter, { max: 1, time: 60000, errors: ["time"] })
      .then((collected) => {
        answers.did = collected.first().content;
        message.channel.send(message2);
      })
      .then((collected) => {
        message.channel
          .awaitMessages(filter, { max: 1, time: 60000, errors: ["time"] })
          .then((collected) => {
            answers.plan = collected.first().content;
            message.channel.send(message3);
          })
          .then((collected) => {
            message.channel
              .awaitMessages(filter, { max: 1, time: 60000, errors: ["time"] })
              .then((collected) => {
                answers.problem = collected.first().content;

                const user = guild.members.cache.get(message.author.id);
                // picking the rolename as rolename and channel name is same
                const channelName = user.roles.cache.first().name;
                console.log("Channel picked: "+ channelName);
                const destinationChannel = guild.channels.cache.find(
                  (channel) => channel.name == channelName
                );
                console.log("Destination channel: " + destinationChannel.channelName + ", " + destinationChannel.channelID);
                const channel = destinationChannel; // pass this to calculate leaderboard score
                const student = message.author; // pass this to calculate leaderboard score
                const updateEmbed = new Discord.MessageEmbed()
                  .setColor("#0099ff")
                  .setTitle(`${message.author.username} progress updates`)
                  .addFields(
                    { name: message1, value: answers.did },
                    { name: message2, value: answers.plan, },
                    { name: message3, value: answers.problem }
                  )
                  .setTimestamp();
                destinationChannel.send(updateEmbed);

                // call the leaderboard function here with arg(channel,student){
                //     inside this calculate the LeaderBoard score and put on dm 
                //     message : All done! Congrats for maintaining a streak for X days!"
                // }
                // right now sending in generic confirmation message to the user 
                message.channel.send(message4);
                saveToDataBase(dialyStandUpDB, channel, student, answers); // saving the standup answers to db
              })
              .catch((collected) => {
                message.channel.send(messageTimeout);
                console.log("standup error: " + collected);
              });
          })
          .catch((collected) => {
            message.channel.send(messageTimeout);
            console.log("standup error: " + collected);
          });
      })
      .catch((collected) => {
        message.channel.send(messageTimeout);
        console.log("standup error: " + collected);
      });
  }
}

function saveToDataBase(dialyStandUpDB, channel, student, answers) {
  //console.log(channelID,student.id,answers);
  // console.log("bd is called");
  var channelID= channel.id;
  var studentID = student.id;
  var date = get_Date();
  var dailyStandUp=dialyStandUpDB.child(date);

  if(dailyStandUp.key != date ){
      dialyStandUpDB.set(date);
      dailyStandUp= dialyStandUpDB.child(date)
  }
  var channelNode = dailyStandUp.child(channelID);
  if(channelNode.key != channelNode){
      dailyStandUp.set(channelID);
      channelNode = dailyStandUp.child(channelID);
  }

  var studentNode = channelNode.child(studentID);
  if(studentNode.key != studentNode){
      channelNode.set(studentID);
      studentNode = channelNode.child(studentID);
  }

  studentNode.update({ answers })
}

function get_Date() {
  var D = new Date();
  let day = D.getDate().toString();
  let month = D.getMonth().toString();
  let year = D.getFullYear().toString();

  let date = year + month + day;

  return date;
}

module.exports = {
  StandUpscheduler,
  standUpCommands,
  getDataAndSchdule,
};
