const Discord = require('discord.js');
const Firebase = require('./Firebase/firebase');
const Command = require('./Response/BotCammands.js');
//const standupConfigClass = require('./StandupConfigData.js');
// const adminDatabaseSystem = require('./adminDatabaseSystem/SaveSystem');

const dotenv = require('dotenv');
const { setupFirebase } = require('./Firebase/firebase');
const StandupConfigData = require('./StandupConfigData');
const leaderboardmodule = require('./LeaderBoard/LeaderBoard.js');
const LeaderBoardStudentData = require('./LeaderBoard/LeaderBoardStudentData');
dotenv.config();

const client = new Discord.Client();
const adminDatabase = setupFirebase();

//adminDatabaseSystem.SetupSQLadminDatabase();
//var generalChannel;

client.login(process.env.DISCORD_APP_TOKEN); 
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    //generalChannel = client.channels.get(process.env.GENERAL_CHANNEL_ID);
});

client.on('message', async msg => {
    if (msg.author.username != "Bot_helper") {
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
            //leaderboardmodule.InitLeaderBoardDatabase(adminDatabase);
            //leaderboardmodule.MakeCopyOfLeaderBoard();
            // studentData = new LeaderBoardStudentData();
            // studentData.ChannelId = "12";
            // studentData.StudentId = 30;
            // studentData.Score = leaderboardmodule.CalculateScore();
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
        else if (msg.content.startsWith("!createrole") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) 
            { 
                // command as !createrole rolename ['permissions','permission2']
                var splitMsgContents = msg.content.split(" ");    // splitting command content
                var roleName = splitMsgContents[1];
                var rolePermissions = splitMsgContents[2];
                var defaultPerms = ['MANAGE_MESSAGES', 'KICK_MEMBERS'];
                if(rolePermissions == null)
                {
                    rolePermissions = defaultPerms;
                }
                msg.guild.roles.create({data:{name:roleName,permissions:rolePermissions}});
            }
        }
        else if (msg.content.startsWith("!configstandup") && msg.channel.name === "bot") {           
            if(msg.member.roles.cache.some(role => role.name === 'team')) {
                var splitMsgContents = msg.content.split(" ");    // !configstandup roleid channelid time1,time2,time3 time format 00:00 24hr format    
                var resroleid = splitMsgContents[1];
                var reschannelid = splitMsgContents[2];
                var timeList = splitMsgContents[3];
                var timesplit = timeList.split(",");
                //var rolenamebyid = "hello";
                //const resrolename = msg.guild.roles.fetch(resroleid,true).then(res =>{rolenamebyid = res.name;});
                const roledatabyid = msg.guild.roles.cache.find(role=>role.id == resroleid);
                standupData = new StandupConfigData(resroleid,reschannelid,timesplit[0],timesplit[1],timesplit[2]);
                var rolename = roledatabyid.name;
                var StandupConfigDB = adminDatabase.ref("/StandupConfig");
                if(rolename != null){
                    // adminDatabase is firebase here and its child has same name as rolename
                    if(StandupConfigDB.child(rolename) == rolename){
                        var dbchild = StandupConfigDB.child(rolename); 
                        dbchild.update({
                            standupData
                        });
                    }
                    else{
                        var dbchild = StandupConfigDB.child(rolename); 
                        dbchild.set(standupData);
                    }
                }else{
                    if(StandupConfigDB.child(resroleid) == resroleid){
                        var dbchild = StandupConfigDB.child(resroleid); 
                        dbchild.update({
                            standupData
                        });
                    }
                    else{
                        var dbchild = StandupConfigDB.child(resroleid); 
                        dbchild.set(standupData);
                    }
                }               
            }      
        }
        else if (msg.content.startsWith("!createchannel") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) {
                var splitMsgContents = msg.content.split(" ");    // splitting command content
                var channelName = splitMsgContents[1];
                var channelReason = splitMsgContents[2];
                if(channelReason == null){
                    channelReason = "Outscal Server for education";
                }
                msg.guild.channels.create(channelName, { reason: channelReason });
            }
        }
        
        else if (msg.content.startsWith("!showid") && msg.channel.name === "bot") {           
            msg.reply("Your Discord Id is : " + msg.author);    
            //SendMessageToChannel(reply, msg.channel.id);       
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
}); 

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
    })
}

function SendMessageToChannel(message,channelID) {
    client.channels.cache.get(channelID).send(message);
}
