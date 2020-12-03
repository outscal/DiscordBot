const standup = require("./StandUp/StandUp_bot");
const Discord = require('discord.js');
var schedule = require("node-schedule");
const Firebase = require('./Firebase/firebase.js');
const Command = require('./Response/BotCammands.js');
const stringMessage = require('./Strings/ServerStrings');
const dotenv = require('dotenv');
const { setupFirebase } = require('./Firebase/firebase');
const StandupConfigData = require('./StandupConfigData');
const leaderboardmodule = require('./LeaderBoard/LeaderBoard.js');
const LeaderBoardStudentData = require('./LeaderBoard/LeaderBoardStudentData');
//const { ALL, DEFAULT } = require("discord.js/src/util/Permissions");
//const { FLAGS } = require("discord.js/src/util/BitField");
const { giveRoleDMmessage } = require("./Strings/ServerStrings");
const { returnTimeInIST } = require("./LeaderBoard/LeaderBoard.js");
const { updateKarma, getKarma } = require("./LeaderBoard/Karma.js");

dotenv.config();

const serverID = "536834108077113364"; // remember to change to Outscal server id
const client = new Discord.Client();
const adminDatabase = setupFirebase();

var everyoneid = "536834108077113364";
var botid = "736968069649530923";
const morningTime = "StandupMorningTime";
const eveningTime = "StandupEveningTime";

// main Outscal guild object - use this everywhere 
var myGuild; 
var copyMins = "30"; // time in ireland time to copy previous day leader board data to today 
var copyhours = "1";

client.login(process.env.DISCORD_APP_TOKEN); 
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    myGuild = client.guilds.resolve(serverID);
    console.log("Myguild id: " + myGuild.id);
    // leaderboardmodule.InitLeaderBoardDatabase(adminDatabase);
    // standup.getDataAndSchdule(adminDatabase, client, myGuild);
    // schedule.scheduleJob(`${copyMins} ${copyhours} * * *`, function () {
    //     //console.log("inside Copy Schedule");
    //     leaderboardmodule.InitLeaderBoardDatabase(adminDatabase);
    //     leaderboardmodule.MakeCopyOfLeaderBoard();
    // });
    // returnTimeInIST('12:15');
    //leaderboardmodule.leaderboardResultMessage(adminDatabase,null,client);
});

const WelcomeMessage = `Hi there - 
Welcome to Outscal’s community. Thanks for joining <3 
Goal of the community is to bring game industry professionals and aspirants in one place globally to share learning, participate in game jams, have fun building games :) 

We have a free C++ course for game developers (no prior coding needed) that you can access by signing up here - https://linktr.ee/Outscal

Feel free to invite your friends to be part of the community using the link above. 
Cheers! 
`;

client.on('guildMemberAdd', member => {
    member.send(WelcomeMessage);
});

client.on('message', async msg => {
    if (msg.channel.type == "dm") {
        standup.standUpCommands(msg, client, myGuild, adminDatabase);
    } 
    // commands only team members can run 
    // TODO refactor to have all team commands in one module and community commands in a different module 
    else if(msg.content.startsWith("!") && msg.member.roles.cache.some(role => role.name === 'team')) {
        if (msg.content == '!help') {
            msg.reply(Command.Help());
        } 
        else if(msg.content.startsWith("!countmembers")) {
            // !countmembers rolename
            var splitMsgContents = msg.content.split(" ");
            var rolename = splitMsgContents[1];
            var count = await Command.FindRoleMemberCount(myGuild, rolename);
            msg.reply("Role members: " + count);
        }
        else if(msg.content.startsWith("!test")) {
            //leaderboard test
            test();
        }
        else if (msg.content.startsWith("!configstandup") && msg.channel.name === "bot") {
            //console.log("inside config");
            var splitMsgContents = msg.content.split(" ");    // !configstandup activate(true) RoleName channelname time1,time2,time3 time format 00:00 24hr format    
            var isActivateConfig = splitMsgContents[1];
            var resroleName = splitMsgContents[2];
            var reschannelName = splitMsgContents[3];
            var timeList = splitMsgContents[4];
            var timesplit = timeList.split(",");
            var channelinfo = myGuild.channels.cache.find(channel => channel.name === reschannelName);
            var roleinfo = myGuild.roles.cache.find(role => role.name === resroleName);
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

            // standup.StandUpscheduler(roleinfo.id,channelinfo.id,channelinfo,timesplit[0],client,myGuild,morningTime);
            // standup.StandUpscheduler(roleinfo.id,channelinfo.id,channelinfo,timesplit[1],client,myGuild,eveningTime);
            // leaderboardmodule.leaderBoardScheduler(adminDatabase,channelinfo,timesplit[2],client);
        }
        else if (msg.content.startsWith("!createrole") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) 
            { 
                var rolePermissions = [];
                // command as !createrole rolename permissions,permission2 more help if you do not write permission default perms will be applied
                var splitMsgContents = msg.content.split(" ");    // splitting command content
                var roleName = splitMsgContents[1];
                if(splitMsgContents[2] != null){
                    var rolePermissionsList = splitMsgContents[2].split(",");
                    for(var i =0;i<rolePermissionsList.length;i++){
                        rolePermissions.push(rolePermissionsList[i]);
                    }
                }
                var defaultPerms = ["SEND_MESSAGES","VIEW_CHANNEL","SEND_TTS_MESSAGES","MENTION_EVERYONE"];
                //var defaultPerms = new Discord.Permissions(DEFAULT);
                if(rolePermissions == "")
                {
                    rolePermissions = defaultPerms;
                    //console.log("inside" +rolePermissions);
                    //console.log(typeof(rolePermissions));
                }
                //console.log(rolePermissions,roleName);
                //console.log(typeof(rolePermissions));
                console.log("outside"+rolePermissions);
                msg.guild.roles.create({data:{name:roleName,permissions:rolePermissions,color: "00FFFF",}});
                msg.reply("Role :"+roleName+"created with permissions :"+rolePermissions);
            }
        }
        else if (msg.content.startsWith("!createchannel") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) {
                var splitMsgContents = msg.content.split(" ");  // splitting command content
                var channelName = splitMsgContents[1]; // !createchannel channelname categoryName rolemap reason
                var categoryName = splitMsgContents[2];
                var rolemap = splitMsgContents[3];
                channelReason = splitMsgContents[4];
                if(channelReason == null){
                    channelReason = "Outscal Server for education";
                }
                var categoryid = myGuild.channels.cache.find(channel => channel.name === categoryName);
                var rolemapinfo =  myGuild.roles.cache.find(role => role.name === rolemap);

                //console.log(channelName,channelReason);
                myGuild.channels.create(channelName, { reason: channelReason,parent: categoryid,type: "text",permissionOverwrites: [
                    { id: msg.guild.id, deny: ['VIEW_CHANNEL'], },
                    { id: msg.author.id, allow: ['VIEW_CHANNEL'], },
                    { id: everyoneid, deny: ['VIEW_CHANNEL'], },
                    { id: rolemapinfo.id , allow: ['MANAGE_CHANNELS','MANAGE_ROLES','VIEW_CHANNEL','SEND_MESSAGES'], },
                    { id: botid, allow:['MANAGE_CHANNELS','MANAGE_ROLES','VIEW_CHANNEL','SEND_MESSAGES'], }
                ],}).then(console.log("Success"))
                .catch(console.error);
                msg.reply("Channel : "+channelName+"created with reason : "+channelReason);
            }
        }
        else if (msg.content.startsWith("!createcategory") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) {
                var splitMsgContents = msg.content.split(" ");  // splitting command content// !createcategory categoryName rolemap reason
                var categoryName = splitMsgContents[1];
                var rolemap = splitMsgContents[2];
                channelReason = splitMsgContents[3];
                if(channelReason == null){
                    channelReason = "Outscal Server for education";
                }
                //var categoryid = myGuild.channels.cache.find(channel => channel.name === categoryName);
                var rolemapid =  myGuild.roles.cache.find(role => role.name === rolemap);
                //console.log(channelName,channelReason);
                msg.guild.channels.create(categoryName, { reason: channelReason,type: "category",permissionOverwrites: [
                    { id: myGuild.id, deny: ['VIEW_CHANNEL'], },
                    { id: msg.author.id, allow: ['VIEW_CHANNEL'], },
                    { id: everyoneid, deny: ['VIEW_CHANNEL'], },
                    { id: botid, allow:['MANAGE_CHANNELS','MANAGE_ROLES','VIEW_CHANNEL','SEND_MESSAGES'], },
                    { id: ()=>{if(rolemapid.id != null){return rolemapid.id;}else{return botid}} , allow:['MANAGE_CHANNELS','MANAGE_ROLES','VIEW_CHANNEL','SEND_MESSAGES'], }
                ],}).then(console.log("Success"))
                .catch(console.error);
                msg.reply("Category : "+channelName+"created with reason : "+channelReason);
            }
        }
        else if (msg.content.startsWith("!givepermission") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) {
                var splitMsgContents = msg.content.split(" ");  // splitting command content
                var channelName = splitMsgContents[1];// !givepermission channelname rolename 
                var rolename = splitMsgContents[2];
                var roleinfo =  myGuild.roles.cache.find(role => role.name === rolename);
                var channelinfo = myGuild.channels.cache.find(channel => channel.name === channelName);
                channelinfo.overwritePermissions([
                    { id: roleinfo.id, allow: ['VIEW_CHANNEL'], },
                    { id: myGuild.id, deny: ['VIEW_CHANNEL'], },
                    { id: msg.author.id, allow: ['VIEW_CHANNEL'], },
                    { id: everyoneid, deny: ['VIEW_CHANNEL'], },
                    { id: botid, allow:['MANAGE_CHANNELS','MANAGE_ROLES','VIEW_CHANNEL','SEND_MESSAGES'], },
                ]).catch(console.err);
                msg.reply("Channel : "+channelName+" Role : "+rolename+" are Binded");
                //console.log(channelinfo.id+"g"+myGuild.id+"id"+roleinfo.id);//741252591932932117 + 741245483904663583
            }
        }
        else if (msg.content.startsWith("!giverole") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) { 
                
                // command as !giverole discordId,discordId roleId
                var splitMsgContents = msg.content.split(" ");    // splitting command contents 
                var allStudentId = splitMsgContents[1];           // All discord ID's
                var batchID = splitMsgContents[2];                // roleId to assign
                var studentIdList = allStudentId.split(",");
                const roleToAssign = msg.guild.roles.cache.find(role=>role.id == batchID);
                
                console.log(msg.guild.members);
                // console.log(splitMsgContents);
                // console.log("Role to assign: " + roleToAssign);
                // console.log(msg);
                // console.log(msg.guild);
                // for(var i = 0; i < studentIdList.length; i++){
                    //find from discord id which member of discord 
                    // var studentmember = msg.guild.members.cache.find(member=>member.id == studentIdList[i]);
                    // msg.guild.members.fetch(studentIdList[i])
                    // .then(studentmember => {  
                            // studentmember.roles.add(roleToAssign);
                            // console.log(studentmember);
                            // msg.reply("student : "+studentmember.displayName+" is assigned to role " + roleToAssign.name); 
                    // })
                    // .catch(err => msg.reply("student with id: "+ studentIdList[i] +" not found - "+ err));
                // }
            }
        } 
        
        else if (msg.content.startsWith("!runrole") && msg.channel.name === "bot"){
            if(msg.member.roles.cache.some(role => role.name === 'team')) { 
                // var allStudentId = "778894706704777236,448502376001830915,26936463552365635,778670071395778580,694107209654861845,778665261141721108,659022881837285395,550663003540946974,759508748623413359,777815636604092417,709322612987265055,751760370175049738,751760370175049738,520651604861386765,776792083201392680,776792083201392680,776748821068644353,776748821068644353,776738132254261288,696040410992345088,759654580484309033,776463692141035583,776462542612201523,768050474766434344,482414982454181888,495604788705361940,765115412878589974,708239563285332018,572252528075341825";

                var allStudentId = "778894706704777236,448502376001830915,778670071395778580,694107209654861845,778665261141721108,659022881837285395,550663003540946974,,777815636604092417,709322612987265055,751760370175049738,751760370175049738,520651604861386765,776792083201392680,776792083201392680,776748821068644353,776748821068644353,776738132254261288,696040410992345088,759654580484309033,776463692141035583,776462542612201523,768050474766434344,482414982454181888,495604788705361940,765115412878589974,708239563285332018,572252528075341825";

                var studentNotFound = "26936463552365635, 759508748623413359";
                
                // command as !giverole discordId,discordId roleId
                // var splitMsgContents = msg.content.split(" ");    // splitting command contents 
                // var allStudentId = splitMsgContents[1];           // All discord ID's
                var batchID = "775944116772405249";                // roleId to assign
                var studentIdList = allStudentId.split(",");
                const roleToAssign = msg.guild.roles.cache.find(role => role.id == batchID);

                // console.log(msg.guild);
                // console.log(studentIdList.length);
                // console.log(studentList.length);
                // console.log(msg.guild.members);
                // console.log(splitMsgContents);
                // console.log("Role to assign: " + roleToAssign);
                // console.log(msg);
                // console.log(msg.guild);
                // for(var i = 0; i < studentIdList.length; i++){
                    //find from discord id which member of discord 
                    // var studentmember = msg.guild.members.cache.find(member => member.id == studentIdList[i]);
                    // if(student) console.log(student.id);
                    // else console.log("Not found");
                    // var studentRecord = studentIdList[i];
                    // msg.guild.members.fetch(studentRecord)
                    // .then(student => {
                    //     if(student.id) console.log(student.id);
                    //     else console.log("\nStudent not found.\n");
                    // })
                    // .catch(err => {
                    //     console.log("student with id: "+ studentIdList[i] +" not found - "+ err);
                    // });
                    // if(studentIdList[i] === "undefined") console.log("\nStudent not found.\n");
                    // msg.guild.members.fetch(studentIdList[i])
                    // .then(studentmember => {  
                    //         studentmember.roles.add(roleToAssign);
                    //         // console.log(studentmember);
                    //         msg.reply("student : "+studentmember.displayName+" is assigned to role " + roleToAssign.name); 
                    //         console.log("student : "+studentmember.displayName+" is assigned to role " + roleToAssign.name); 
                    // })
                    // .catch(err => /*console.log("student with id: "+ studentIdList[i] +" not found - "+ err)*/msg.reply("student with id: "+ studentIdList[i] +" not found - "+ err));
                // }
            }
        
        }                
        // Karma command
        /*else if(msg.content.startsWith("karma") && msg.channel.name === "bot"){
            console.log(msg.author);
            var mention = msg.author.id;
            var karmaPoints = getKarma(mention);
            
            var tag = `<@!${mention}>`;
            
	        msg.channel.send(`${tag} you have ${karmaPoints} Karma points.`);
        }*/
        else if (msg.content.startsWith("!showid") && msg.channel.name === "bot") {
            console.log("running");
            msg.reply("Your Discord Id is : " + msg.author.id + ", in first if statement");
        }
    }
    else if (msg.content == 'ping' && msg.channel.name === "bot") {
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
    else if (msg.content.startsWith("#giverole") && msg.channel.name === "bot") {
        var msgContent = msg.content.toLowerCase();
        msgContent = msgContent.split(" ");
        var roleName = msgContent[1];
        var user = msg.author;

        var userAccount = myGuild.members.cache.get(msg.author.id);
        var existingBatch = userAccount.roles.cache.find(role => role.name.includes("batch"));
        var role = msg.guild.roles.cache.find((role) => role.name == roleName);
        var channel = client.channels.cache.find((channel) => channel.name == roleName);

        if(existingBatch) { 
            msg.channel.send("You are already part of an existing batch");
        }
        else if(!channel || !roleName){ 
            msg.channel.send("Invalid role name/channel. Please check the command again.");
        }
        else if (roleName.startsWith("batch")) {
            msg.member.roles.add(role);
            msg.channel.send("Done! :100: :+1:");
            msg.author.send(stringMessage.giveRoleDMmessage);
            channel.send(`${user} Welcome to ${channel.name}`);
        } 
        else {
            msg.channel.send("Something is wrong, please check the command");
        }
    }
    /*else if (msg.content.startsWith("!showid") && msg.channel.name === "bot") {
        console.log("running");
        msg.reply("Your Discord Id is : " + msg.author.id);
    }*/
    else if(msg.content.startsWith("!karma") && msg.channel.name === "bot"){
        console.log(msg.author);
        var mention = msg.author.id;
        var karmaPoints = getKarma(mention);
        
        var tag = `<@!${mention}>`;
        
        msg.channel.send(`${tag} you have ${karmaPoints} Karma points.`);
    }
    else if (msg.content.includes("thank") || msg.content.includes("Thank")) {
        var usersSize = msg.mentions.users.size;
        var author = msg.author;
        
        if(author.username != "OutscalBot"){
            
            updateKarma(myGuild, adminDatabase, msg);
        
        }
    }
});

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
function test(){
    leaderboardmodule.InitLeaderBoardDatabase(adminDatabase); //its firebase db reference
    leaderboardmodule.MakeCopyOfLeaderBoard();
}
