const Discord = require("discord.js");
const { MessageEmbed } = require("discord.js");
var schedule = require("node-schedule");
const { database } = require("firebase-admin");
const { LeaderBoard } = require("../Response/BotCammands");
const leaderboardmodule = require("../LeaderBoard/LeaderBoard.js");
const LeaderBoardStudentData = require("../LeaderBoard/LeaderBoardStudentData");

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

function StandUpscheduler(channelName, hour, min, client) {
  //console.log(`scheduled for channel: ${channelName} at ${hour}:${min}` )
  schedule.scheduleJob(`${min} ${hour} * * *`, function () {
    // set time for standup more on https://www.npmjs.com/package/node-schedule
    startStandUp(channelName, client);
  });
}

function startStandUp(channelName, client) {
  console.log("reminder for", channelName);
  leaderboardmodule.InitLeaderBoardDatabase(adminDatabase); // leader board initilized
  leaderboardmodule.MakeCopyOfLeaderBoard(); // made copy of last day

  const stantUpStartMessage = new MessageEmbed()
    // Set the title of the field
    .setTitle(`Reminder for Daily Standup`)
    // Set the color of the embed
    .setColor(0x16a085)
    // Set the main content of the embed
    .setDescription("start by command 'start'");
  var serverID = "736892439868080130";                    // change the server ID here
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
                saveToLeaderBoard(channel, student, db);
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
