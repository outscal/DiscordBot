const standup = require("./StandUp/StandUp_bot");
const Discord = require('discord.js');
const Firebase = require('./Firebase/firebase.js');
const Command = require('./Response/BotCammands.js');
//const standupConfigClass = require('./StandupConfigData.js');
// const adminDatabaseSystem = require('./adminDatabaseSystem/SaveSystem');

const dotenv = require('dotenv');
const { setupFirebase } = require('./Firebase/firebase');
const StandupConfigData = require('./StandupConfigData');
const leaderboardmodule = require('./LeaderBoard/LeaderBoard.js');
const LeaderBoardStudentData = require('./LeaderBoard/LeaderBoardStudentData');

dotenv.config();

const serverID = "536834108077113364"; // Outscal server id
const client = new Discord.Client();
const adminDatabase = setupFirebase();

// main Outscal guild object - use this everywhere 
var myGuild; 

client.login(process.env.DISCORD_APP_TOKEN); 
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    //generalChannel = client.channels.get(process.env.GENERAL_CHANNEL_ID);
    myGuild = client.guilds.resolve(serverID);
    console.log("Myguild id: " + myGuild.id);
    standup.getDataAndSchdule(adminDatabase, client, myGuild);
});

client.on('message', async msg => {
    if (msg.channel.type == "dm") {
        standup.standUpCommands(msg, client, myGuild, adminDatabase);
    } 
    else if (msg.author.username != "Bot_helper") {
        // if (msg.type == "GUILD_MEMBER_JOIN") {
        //     console.log("User Joined" + msg.author.username + " " + msg.author.id);
        //     var userInfo = {
        //         ID: msg.author.id,
        //         UserName: msg.author.username
        //     }
        //     adminDatabaseSystem.CreateUser(userInfo);
        //     msg.reply("Welcome! Please introduce yourself to the rest of the clan.");
        // } 
        if (msg.content == 'ping') {
            SendMessageToChannel("pong",msg.channel.id);
        } 
        // else if (msg.content == '!leaderboard') {
        //     var leaderboardString = await Command.LeaderBoard();
        //     SendMessageToChannel(leaderboardString,msg.channel.id);
        // } 
        // else if (msg.content == '!points') {
        //     var messagePoints = await Command.Points(msg.author.id);
        //     SendMessageToChannel(messagePoints,msg.channel.id);
        // } 
        else if (msg.content == '!help') {
            msg.reply(Command.Help());
        } 
        else if (msg.content == '!Leaderboardtest') {
            // leaderboardmodule.InitLeaderBoardDatabase(adminDatabase);
            // leaderboardmodule.MakeCopyOfLeaderBoard();
            // studentData = new LeaderBoardStudentData();
            // studentData.ChannelId = "12";
            // studentData.StudentId = 31;
            // studentData.Streak = 0;//leaderboardmodule.CalculateStreak(studentData.ChannelId,studentData.StudentId);
            // studentData.IsStreak = true;
            // studentData.Score = 0;//leaderboardmodule.CalculateScore(studentData.ChannelId,studentData.StudentId);
            // leaderboardmodule.setupLeaderBoardDB(studentData);
            // leaderboardmodule.CreateLeaderBoardDBServer();
            //leaderboardmodule.GetPreviousDate();
        } 
        else if (msg.content.startsWith("!giverole") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) { 
                
                // command as !giverole discordId,discordId roleId
                var splitMsgContents = msg.content.split(" ");    // splitting command contents 
                var allStudentId = splitMsgContents[1];           // All discord ID's
                var batchID = splitMsgContents[2];                // roleId to assign
                var studentIdList = allStudentId.split(",");
                const roleToAssign = msg.guild.roles.cache.find(role=>role.id == batchID);
                for(var i = 0 ;i<studentIdList.length;i++){
		            //find from discord id which member of discord 
                    //var studentmember = msg.guild.members.cache.find(member=>member.id == studentIdList[i]); 
                    msg.guild.members.fetch(studentIdList[i])
			        .then(studentmember => {  
                    		studentmember.roles.add(roleToAssign);
                    		msg.reply("student : "+studentmember.displayName+" is assigned to role " + roleToAssign.name); 
			        })
			        .catch(err => msg.reply("student with id: "+ studentIdList[i] +" not found - "+ err));
                    /*if(studentmember === undefined) {
                                msg.reply("student with id: "+ studentIdList[i] +" not found"); 
                    } else {
                                studentmember.roles.add(roleToAssign);
                                msg.reply("student : "+studentmember.displayName+" is assigned to role " + roleToAssign.name); 
                    }*/
                }               
            }
        }
        else if (msg.content.startsWith("!configstandup") && msg.channel.name === "bot") {           
            if(msg.member.roles.cache.some(role => role.name === 'team')) {
                //console.log("inside config");
                var splitMsgContents = msg.content.split(" ");    // !configstandup activate(true) RoleName channelname time1,time2,time3 time format 00:00 24hr format    
                var isActivateConfig = splitMsgContents[1];
                var resroleName = splitMsgContents[2];
                var reschannelName = splitMsgContents[3];
                var timeList = splitMsgContents[4];
                var timesplit = timeList.split(",");
                //var rolenamebyid = "hello";
                var channelinfo = myGuild.channels.cache.find(channel => channel.name === reschannelName);
                var roleinfo = myGuild.roles.cache.find(role => role.name === resroleName);
                //const roledatabyid = msg.guild.roles.cache.find(role=>role.id == resroleName);
                standupData = new StandupConfigData(roleinfo.id,isActivateConfig,channelinfo.id,timesplit[0],timesplit[1],timesplit[2]);
                var StandupConfigDB = adminDatabase.ref("/StandupConfig");
                if(StandupConfigDB.child(resroleName) == resroleName){
                    var dbchild = StandupConfigDB.child(resroleName); 
                    dbchild.update({
                        standupData
                    });
                }
                else{
                    var dbchild = StandupConfigDB.child(resroleName); 
                    dbchild.set(standupData);
                }              
            }      
        }
        else if (msg.content.startsWith("!createrole") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) 
            { 
                // command as !createrole rolename permissions,permission2
                var splitMsgContents = msg.content.split(" ");    // splitting command content
                var roleName = splitMsgContents[1];
                var rolePermissionsList = splitMsgContents[2].split(",");
                for(var i =0;i<rolePermissionsList.length;i++){
                    var rolePermissions = [];
                    rolePermissions.push(rolePermissionsList[i]);
                }
                var defaultPerms = ['SEND_MESSAGES','Change_Nicknames'];
                if(rolePermissions == null)
                {
                    rolePermissions = defaultPerms;
                    //console.log(typeof(rolePermissions));
                }
                //console.log(rolePermissions,roleName);
                //console.log(typeof(rolePermissions));
                msg.guild.roles.create({data:{name:roleName,permissions:rolePermissions}});
                msg.reply("Role :"+roleName+"created with permissions :"+rolePermissions);
            }
        }
        else if (msg.content.startsWith("!createchannel") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) {
                var splitMsgContents = msg.content.split(" ");  // splitting command content
                var channelName = splitMsgContents[1];// createchannel channelname channelreason
                var channelReason = splitMsgContents[2];
                if(channelReason == null){
                    channelReason = "Outscal Server for education";
                }
                //console.log(channelName,channelReason);
                msg.guild.channels.create(channelName, { reason: channelReason });
                msg.reply("Channel :"+channelName+"created with reason :"+channelReason);
            }
        }
        else if (msg.content.startsWith("!showid") && msg.channel.name === "bot") {
            msg.reply("Your Discord Id is : " + msg.author);
            //SendMessageToChannel(reply, msg.channel.id);
        }
        // else if (msg.content.startsWith("!createrole") && msg.channel.name === "bot"){
        //     if(msg.member.roles.cache.some(role => role.name === 'team')) 
        //     { 
        //         // command as !createrole rolename ['permissions','permission2']
        //         var splitMsgContents = msg.content.split(" ");    // splitting command content
        //         var roleName = splitMsgContents[1];
        //         var rolePermissions = splitMsgContents[2];
        //         var defaultPerms = ['MANAGE_MESSAGES', 'KICK_MEMBERS'];
        //         if(rolePermissions == null)
        //         {
        //             rolePermissions = defaultPerms;
        //         }
        //         msg.guild.roles.create({data:{name:roleName,permissions:rolePermissions}});
        //     }      
        // }
    }
        // else if (msg.content.includes("thank")) {
        //     //console.log(msg.mentions.users.array()[0]);
        //     for (var i = 0; i < msg.mentions.users.size; i++) {
        //         console.log(msg.mentions.users.array()[i].id);
        //         if (msg.mentions.users.array()[i].id != msg.author.id) {
        //             databaseSystem.UpdateKarmaPoints(msg.mentions.users.array()[i].id);
        //             SendMessageToChannel("Karma point awarded to:" + msg.mentions.user.array()[i].id,msg.channel.id);
        //         }
        //     }
        // }
    }
    // else if (msg.content.includes("thank")) {
    //     //console.log(msg.mentions.users.array()[0]);
    //     for (var i = 0; i < msg.mentions.users.size; i++) {
    //         console.log(msg.mentions.users.array()[i].id);
    //         if (msg.mentions.users.array()[i].id != msg.author.id) {
    //             databaseSystem.UpdateKarmaPoints(msg.mentions.users.array()[i].id);
    //             SendMessageToChannel("Karma point awarded to:" + msg.mentions.user.array()[i].id,msg.channel.id);
    //         }
    //     }
    // }
);

// function SetupBotForChannel(msg){
//     for (var i = 0; i < msg.channel.members.size; i++) {
//         var userInfo = { };
//         if(msg.channel.members.array()[i].nickname!=null){
//             console.log(msg.channel.members.array()[i].nickname)
//             userInfo = {
//                 ID: msg.channel.members.array()[i].user.id,
//                 UserName: msg.channel.members.array()[i].nickname
//             }
//         }else{
//             console.log(msg.channel.members.array()[i].user.username);
//             userInfo = {
//                 ID: msg.channel.members.array()[i].user.id,
//                 UserName: msg.channel.members.array()[i].user.username
//             }
//         }
//         databaseSystem.CreateUser(userInfo);
//     }
// }

// function SendAttatchment(link) {
//     // Provide a path to a local file or link
//     const localFileAttachment = new Discord.Attachment(link);
//     generalChannel.send(localFileAttachment);
// }

// function ListOfServers() {
//     // List servers the bot is connected to
//     console.log("Servers:")
//     client.guilds.forEach((guild) => {
//         console.log(" - " + guild.name);
//         ListOfChannels(guild);

//     })
// }

// function ifTagged(receivedMessage) {
//     return receivedMessage.content.includes(client.user.toString())
// }
function ListOfChannels(guild) {
  guild.channels.forEach((channel) => {
    console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`);
  });
}

function SendMessageToChannel(message, channelID) {
  client.channels.cache.get(channelID).send(message);
}

function returnScore(score,dbToUpdate){
    dbToUpdate.child("Score").set(score);
}

// standup configs below

// standup configs above


