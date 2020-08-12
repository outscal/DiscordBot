const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
var schedule = require("node-schedule");
const { database } = require("firebase-admin");
const { LeaderBoard } = require("../Response/BotCammands");
const leaderboardmodule = require("../LeaderBoard/LeaderBoard.js");
const LeaderBoardStudentData = require("../LeaderBoard/LeaderBoardStudentData");

const message1 = "What did you do today?";
const message2 = "What are you planning on doing tomorrow?";
const message3 = "Do you need any help?";
const message4 = "Thanks for submitting your update!";
const messageTimeout = `Timed out! Please start again using the "start" command`;



function getDataAndSchdule(db, client, guild) {

  var database = db.ref("/StandupConfig");
  database.on("value", function (snapShot) {
    snapShot.forEach((channel) => {
      if (channel.val().IsON) {
        // checking for channel has active standup
        var channelName = channel.key;
        var resroleid = channel.val().RoleId;
        var reschannelid = channel.val().ChannelId;
        //console.log(channelName);
        if (channel.val().StandupEveningTime) {
          var time = channel.val().StandupEveningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          //console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          StandUpscheduler(resroleid,reschannelid, hour, min, client, guild);
        }

        if (channel.val().StandupMorningTime) {
          var time = channel.val().StandupMorningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          // console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          StandUpscheduler(resroleid,reschannelid, hour, min, client, guild);

        }
        if (channel.val().StandupLeaderBoardTime) {
          var time = channel.val().StandupMorningTime;
          time = time.split(":");
          hour = time[0];
          min = time[1];
          // console.log(`send reminder for ${channelName} at ${hour} : ${min}`);
          leaderBoardScheduler(db,channel, hour, min, client);
        }
      }
    });
  });
}

function StandUpscheduler(resroleid,reschannelid, hour, min, client, guild) {
  //console.log(`scheduled for channel: ${channelName} at ${hour}:${min}` )
  schedule.scheduleJob(`${min} ${hour} * * *`, function () {
    startStandUp(resroleid,reschannelid,client, guild);
    // leader board copy logic here
  });
}

function startStandUp(resroleid,reschannelid, client, guild) {
  //console.log("reminder for", reschannelid);
  leaderboardmodule.InitLeaderBoardDatabase(adminDatabase); // leader board initilized
  leaderboardmodule.MakeCopyOfLeaderBoard(); // made copy of last day

  const stantUpStartMessage = new MessageEmbed()
    .setTitle(`Reminder for Daily Standup`)
    .setColor(0x16a085)
    .setDescription("start by command 'start'");


  // const myGuild = client.guilds.cache.get(serverID); 
  guild.members.cache.map((user) => { 
    var batchRole = user.roles.cache.find(role => role.name.includes("batch"));//returns roleid which has name of batch in it 
    if (batchRole == resroleid) {
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
                saveToLeaderBoard(channel, student, db);
                saveToDataBase(dialyStandUpDB, destinationChannel, message.author, answers); // saving the standup answers to db

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


function saveToLeaderBoard(channel, student, adminDatabase) {
  leaderboardmodule.InitLeaderBoardDatabase(adminDatabase);
  studentData = new LeaderBoardStudentData();
  studentData.ChannelId = channel.id;
  studentData.StudentId = student.id;
  studentData.Streak = 0; //leaderboardmodule.CalculateStreak(studentData.ChannelId,studentData.StudentId);
  studentData.IsStreak = true;
  studentData.Score = 0;
  leaderboardmodule.setupLeaderBoardDB(studentData);
  leaderboardmodule.CalculateScore(
    studentData.ChannelId,
    studentData.StudentId,
    returnScore
  );
  leaderboardmodule.CreateLeaderBoardDBServer();
  leaderboardmodule.GetPreviousDate();
  var score= getScore(db,channel,student);
  student.send(`All done! your current  score is ${score}`);

}

function getScore(DbReference,channel, student){
  var date_ob = new Date();
  var ChannelId = channel.id;
  var studentid = student.id;
  var presentYear = date_ob.getFullYear();
  var presentMonth = date_ob.getMonth()+1;
  var presentDay = date_ob.getDate();
  var presentStudentDb = DbReference.ref("/LeaderBoard/"+presentYear+"/"+presentMonth+"/"+presentDay+"/"+ChannelId+"/"+studentid);

  presentStudentDb.on('value',gotData,errData);
    function gotData(data){
        var score = data.val().Score;
        return (score);
    }
    function errData(error){
        console.log(error);
    }
}

function saveToDataBase(dialyStandUpDB, channel, student, answers) {

  //console.log(channelID,student.id,answers);
  // console.log("bd is called");
  var channelID= channel.id;

  var studentID = student.id;
  var date = get_Date();
  var dailyStandUp = dialyStandUpDB.child(date);

  if (dailyStandUp.key != date) {
    dialyStandUpDB.set(date);
    dailyStandUp = dialyStandUpDB.child(date);
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
  let month = (D.getMonth() + 1).toString();
  let year = D.getFullYear().toString();

  let date = year + month + day;
  console.log(month);
  return date;
}

function leaderBoardScheduler(db,channel, hour, min, client){ 
  schedule.scheduleJob(`${min} ${hour} * * *`, function () {
    // set time for standup more on https://www.npmjs.com/package/node-schedule
    leaderboardResultMessage(db,channel,client);
  });
}

function leaderboardResultMessage(DbReference,channel,client) {
  var date_ob = new Date();
  var ChannelId = channel.id;
  var leaderBoardListArray=[];
  var presentYear = date_ob.getFullYear();
  var presentMonth = date_ob.getMonth()+1;
  var presentDay = date_ob.getDate();
  var presentChannelDb = DbReference.ref("/LeaderBoard/"+presentYear+"/"+presentMonth+"/"+presentDay+"/"+ChannelId);
  presentChannelDb.on("value",function(channel){
    channel.forEach(student=>{
      let studentID = student.key;
      let studentName = client.channels.cache.get(ChannelId).members.find(user=> user.id == studentID).name;
      
      let score = student.val();
      leaderBoardListArray.push({studentName,score});
    })
  })

  leaderBoardListArray.sort((a,b)=>(a.score >b.score) ? 1 : -1);

  var listoftopTen = leaderBoardListArray.slice(0,10);

  const leaderEmbed = new Discord.MessageEmbed()
                  .setColor("#0099ff")
                  .setTitle(`Course LEADERBOARD`)

                  .addFields(
                    listoftopTen.map((element,index)=>{
                      return {name: `Rank is ${index+1}` , value: `${element.studentname} is at ${element.score}`}
                    }
                       )

                    
                  )

                  .setTimestamp();
  

}

module.exports = {
  StandUpscheduler,
  standUpCommands,
  getDataAndSchdule,
  leaderBoardScheduler
};
