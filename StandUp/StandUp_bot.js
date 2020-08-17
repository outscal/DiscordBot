const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
var schedule = require("node-schedule");
const { database } = require("firebase-admin");
const { LeaderBoard } = require("../Response/BotCammands");
const { saveToLeaderBoard , leaderBoardScheduler } =  require("../LeaderBoard/LeaderBoard");
const message1 = "What did you do today?";
const message2 = "What are you planning on doing tomorrow?";
const message3 = "Do you need any help?";
const message4 = "Thanks for submitting your update!";
const messageTimeout = `Timed out! Please start again using the "start" command`;



function getDataAndSchdule(db, client, guild) {
  
  var database = db.ref("/StandupConfig");
  database.once("value", function (snapShot) {
    console.log("----------------------------");
    snapShot.forEach((channel) =>{
      if (channel.val().IsON) {  // checking for channel has active standup 
        var resroleid = channel.val().RoleId;
        var reschannelid = channel.val().ChannelId;
        var channelObject= guild.channels.cache.find(element=> element.id == reschannelid);
        
        if (channel.val().StandupEveningTime){
          var time = channel.val().StandupEveningTime;
          
          //console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          if(channelObject){
            StandUpscheduler(resroleid,reschannelid,channelObject,time, client, guild);
          }
          
          
        }

        if (channel.val().StandupMorningTime) {
          var time = channel.val().StandupMorningTime;
          if(channelObject){
            StandUpscheduler(resroleid,reschannelid,channelObject,time,client, guild);
          }
        
         
        }
        if (channel.val().StandupLeaderBoardTime) {
          var time = channel.val().StandupLeaderBoardTime;
          
          // console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
        
          if(channelObject){  
            var job =leaderBoardScheduler(db,channelObject,time,client);
           
          }
          
        }
      }
    });
  });
}


function StandUpscheduler(resroleid,reschannelid,channelObject, time, client, guild) {
  time = time.split(":");
  hour = time[0];
  min = time[1];
  console.log(`scheduled for channel: ${channelObject.name} at ${hour}:${min}` )
  var j = schedule.scheduleJob(`${min} ${hour} * * *`, function () {
      startStandUp(resroleid,reschannelid,client, guild);
    
    });
   console.log("Data returened by scheduler",j.nextInvocation());
  
}



function startStandUp(resroleid,reschannelid, client, guild) {
  console.log("start standup called")
  //console.log("reminder for", reschannelid);
  const stantUpStartMessage = new MessageEmbed()
    .setTitle(`Reminder for Daily Standup`)
    .setColor(0x16a085)
    .setDescription("start by command 'start'");

  // const myGuild = client.guilds.cache.get(serverID); 
  guild.members.cache.map((user) => { 
    var batchRole = user.roles.cache.find(role => role.name.includes("batch"));//returns roleid which has name of batch in it 
    
    
    if (batchRole === resroleid) {
       user.send(stantUpStartMessage).catch(console.error);
    }
    // if (user.roles.cache.first().name == channelinfo.id) 
    // {
    //   user.send(stantUpStartMessage).catch(console.error);
    // }
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
                var user = guild.members.cache.get(message.author.id);
                var batchRole = user.roles.cache.find(role => role.name.includes("batch"));
                console.log("BatchRole: " + batchRole.name);

                var destinationChannel = guild.channels.cache.find(channel => channel.name === batchRole.name);
                console.log("Channel: " + destinationChannel.name);
                // console.log("Destination channel: " + destinationChannel.channelName + ", " + destinationChannel.channelID);

                var updateEmbed = new Discord.MessageEmbed()
                  .setColor("#0099ff")
                  // .setTitle(`${message.author.username} progress updates`)
                  .setTitle(`Progress Update -`)
                  .setAuthor(message.author.username)
                  .addFields([
                    { name: message1, value: answers.did },
                    { name: message2, value: answers.plan, },
                    { name: message3, value: answers.problem }]
                  )
                  .setTimestamp();
                destinationChannel.send(updateEmbed);

                // call the leaderboard function here with arg(channel,student){
                //     inside this calculate the LeaderBoard score and put on dm 
                //     message : All done! Congrats for maintaining a streak for X days!"
                // }
                // right now sending in generic confirmation message to the user 
                message.channel.send(message4);
                
                saveToDataBase(dialyStandUpDB, destinationChannel, message.author, answers); // saving the standup answers to db
                saveToLeaderBoard(destinationChannel, message.author, db);
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
  console.log("saved to daily satndup data base !");
}

function get_Date() {
  var D = new Date();
  let day = D.getDate().toString();
  let month = (D.getMonth() +1).toString();
  let year = D.getFullYear().toString();

  let date = year + month + day;

  return date;
}

module.exports = {
  StandUpscheduler,
  standUpCommands,
  getDataAndSchdule,

};
