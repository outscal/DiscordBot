const LeaderBoardStudentData = require("./LeaderBoardStudentData");
const Discord = require("discord.js");
var schedule = require("node-schedule");
var moment = require('moment'); // used for date time calculations
var PreviousDayChannelinfo = null; // holds the database for previous day leaderboard info 
var DbReference = null;  // has the fire base refrence 
var LeaderBoardDb = null; // refernce to leader board db 
var yearLevel,monthLevel,dayLevel,channelLevel,studentLevel = null; // used to define db heiarchy of leaderboard
let date_ob = new Date();  // gives code todays date 
saveStudentData = new LeaderBoardStudentData; // stored studentdata to be used in one function
//Dates 
var prevMonth,prevDay ,prevYear,yesterday  = null;
var prevStudentData = 100;
//always call this before using any function of this file
var InitLeaderBoardDatabase = function InitLeaderBoardDatabase(sendAdminDB){
    DbReference = sendAdminDB;
    LeaderBoardDb = DbReference.ref("/LeaderBoard");
    //Dates
    yesterday = GetPreviousDate();
    var SplitDate = yesterday.toString().split("/");
    prevMonth = SplitDate[0];
    prevDay = SplitDate[1];
    prevYear = SplitDate[2];
}

// reds the data of previous day and copy it to today 
var MakeCopyOfLeaderBoard = function MakeCopyOfLeaderBoard(){
    // var yesterday = GetPreviousDate();
    // var SplitDate = yesterday.toString().split("/");
    // var prevMonth = SplitDate[0];
    // var prevDay = SplitDate[1];
    // var prevYear = SplitDate[2];
    yearLevel = LeaderBoardDb.child(prevYear);
    monthLevel = yearLevel.child(prevMonth);
    dayLevel = monthLevel.child(prevDay);
    var yearKey = yearLevel.getKey(); // as year level comes from firebase so has many things but i need the value
    var monthKey = monthLevel.getKey();
    var dayKey = dayLevel.getKey();
    if( yearKey == prevYear){ // i need to check if the previous day data exists or not 
        if(monthKey == prevMonth){
            if(dayKey == prevDay){
                PreviousDayChannelinfo = DbReference.ref("/LeaderBoard/"+yearKey+"/"+monthKey+"/"+dayKey);
            }
            else
            {
                return;
            }
        }
        else
        {
            return;
        }
    }
    else
    {
        return;
    }
    if(PreviousDayChannelinfo !=null){
        yearLevel = LeaderBoardDb.child(date_ob.getFullYear()); //now i need to copy previous day data to today so set year level to today 
        monthLevel = yearLevel.child(date_ob.getMonth()+1);// as 0 is january so +1 for current month
        dayLevel = monthLevel.child(date_ob.getDate());
        //as PreviousDayChannelinfo holds value for last day database so we need value 
        PreviousDayChannelinfo.once("value", function(snapshot) {
            console.log(snapshot.val());
            //var data = snapshot.val(); after copy make a function to make all the isStreak value false for today
            dayLevel.set(snapshot.val());// as we changed day level to today but update db with previous day data
        });
    }
    // as 0 is january
}
// runs the first time to set all database to default value as all students to score 0 
var InitDefaultLeaderBoard = function InitDefaultLeaderBoard(studentData){
    studentData.Score = 0; // set score 0
    studentData.Streak = 0;
    studentData.IsStreak = false; //false
    setupLeaderBoardDB(studentData); // setup schema for student 
    CreateLeaderBoardDBServer();//update the firebase db
}

//setup a db schema as per parent child and then update db
var setupLeaderBoardDB = function setupLeaderBoardDB(studentData){
    //student data should always be of class LeaderBoardStudentData
    if(DbReference == null){
        console.log("First Init Leader Board with database by running initleaderboard function")
        return;
    }
    else
    {
        saveStudentData = studentData;
        yearLevel = LeaderBoardDb.child(date_ob.getFullYear());
        monthLevel = yearLevel.child(date_ob.getMonth()+1);// as 0 is january
        dayLevel = monthLevel.child(date_ob.getDate());
        channelLevel = dayLevel.child(studentData.ChannelId);
        studentLevel = channelLevel.child(studentData.StudentId);
    }
}
var CreateLeaderBoardDBServer = function CreateLeaderBoardDBServer(){
    if(channelLevel == null){
        console.log("setup a db schema using function setupLeaderBoardDB");
        return;
    }
    if(studentLevel.child(saveStudentData.StudentId)==saveStudentData.StudentId){
        studentLevel.update({Score:saveStudentData.Score,Streak:saveStudentData.Streak,IsStreak:saveStudentData.IsStreak});
    }
    else{
        studentLevel.set({Score:saveStudentData.Score,Streak:saveStudentData.Streak,IsStreak:saveStudentData.IsStreak});
    }
    
}
 async function CalculateScore(ChannelId,studentid,returnScore){

    var presentYear = date_ob.getFullYear();
    var presentMonth = date_ob.getMonth()+1;
    var presentDay = date_ob.getDate();
    var prevDayDb = DbReference.ref("/LeaderBoard/"+prevYear+"/"+prevMonth+"/"+prevDay+"/"+ChannelId+"/"+studentid);
    var presentStudentDb = DbReference.ref("/LeaderBoard/"+presentYear+"/"+presentMonth+"/"+presentDay+"/"+ChannelId+"/"+studentid);

    prevDayDb.on('value',gotData,errData);
    function gotData(data){
        prevStudentData = data.val().Score;
        //console.log(data.val().Score);
        returnScore(prevStudentData+1,presentStudentDb);
        
    }
    function errData(error){
        console.log(error);
    }
//     streak = CalculateStreak(ChannelId,studentid);
//     var presentStudentData = null;
//     var presentStudentDb = DbReference.ref("/LeaderBoard/"+presentYear+"/"+presentMonth+"/"+presentDay+"/"+ChannelId+"/"+Studentid);
//     presentStudentDb.once("value", function(snapshot) {
//         presentStudentData =  snapshot.val();
//     });
//     if(streak == 0){
//         // when changing make it previous day.score +1
//         return presentStudentData.Score + 1;
//     }
//     else{
//         return presentStudentData.Score + 1 + streak;
//     }
}

var CalculateStreak = function CalculateStreak(ChannelId,studentid){
    var presentYear = date_ob.getFullYear();
    var presentMonth = date_ob.getMonth()+1;
    var presentDay = date_ob.getDate();
    // var DayBeforeYesterday = moment().subtract(2, 'days').format('l');
    // var SplitDate = DayBeforeYesterday.toString().split("/");
    // beforePrevMonth = SplitDate[0];
    // beforePrevDay = SplitDate[1];
    // beforePrevYear = SplitDate[2];
    // // data of student day before yesterday
    // var daybeforeStudentData = null;
    // var beforePrevDayDb = DbReference.ref("/LeaderBoard/"+beforePrevYear+"/"+beforePrevMonth+"/"+beforePrevDay+"/"+ChannelId+"/"+Studentid);
    // beforePrevDayDb.once("value", function(snapshot) {
    //     daybeforeStudentData =  snapshot.val();
    // });

    var prevStudentData = null;
    var prevDayDb = DbReference.ref("/LeaderBoard/"+prevYear+"/"+prevMonth+"/"+prevDay+"/"+ChannelId+"/"+Studentid);
    prevDayDb.once("value", function(snapshot) {
        prevStudentData =  snapshot.val();
    });
    var presentStudentData = null;
    var presentStudentDb = DbReference.ref("/LeaderBoard/"+presentYear+"/"+presentMonth+"/"+presentDay+"/"+ChannelId+"/"+Studentid);
    presentStudentDb.once("value", function(snapshot) {
        presentStudentData =  snapshot.val();
    });
    if(presentStudentData || prevStudentData == null)
    {
        if(prevStudentData.IsStreak == false){
            return 0;
        }
        else
        {
            return presentStudentData.streak + 1;
        }
    }
    else
    {
        return 0;
    }
    
    // if(daybeforeStudentData || presentStudentData || prevStudentData == null){
    //     return 0;
    // }
    // else{
    //     if(prevStudentData.Score == daybeforeStudentData.Score){
    //         return 0;
    //     }
    //     else{
    //         return presentStudentData.streak +1;
    //     }

    // }
}

var GetPreviousDate = function GetPreviousDate(){
    var yesterday = moment().subtract(1, 'days');//https://momentjs.com/
    //console.log(yesterday.format('l'));// many formats go on website
    return yesterday.format('l'); //dd/mm/yyyy
}

var GetLeaderBoard = function GetLeaderBoard(){

}
// creates / updates server 


// saving daily data to leadedBoard
function saveToLeaderBoard(channel, student, adminDatabase) {
    console.log("saveToLeaderBoard is called");
    InitLeaderBoardDatabase(adminDatabase);
    studentData = new LeaderBoardStudentData();
    studentData.ChannelId = channel.id;
    studentData.StudentId = student.id;
    studentData.Streak = 0; //leaderboardmodule.CalculateStreak(studentData.ChannelId,studentData.StudentId);
    studentData.IsStreak = true;
    studentData.Score = 0;
    setupLeaderBoardDB(studentData);
    CalculateScore(
      studentData.ChannelId,
      studentData.StudentId,
      returnScore
    )
    setTimeout(() => {
        SendScore(adminDatabase,channel,student);  
    }, 1000);
    
    CreateLeaderBoardDBServer();
    GetPreviousDate();
    
  }

  // Get score from leaderBoard data Base

  function SendScore(DbReference,channel, student){
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
          console.log("from get score ",score);
          student.send(`Your current  score is ${score}`);
      }
      function errData(error){
          console.log(error);
      }
  }

  // leader board scheduler 

  function leaderBoardScheduler(db,channel, hour, min, client){ 
      console.log(hour,min)
    schedule.scheduleJob(`${min} ${hour} * * *`, function () {
        console.log("called function")                                                                    // more on https://www.npmjs.com/package/node-schedule
      leaderboardResultMessage(db,channel,client);
    });
  }

  // Leard Board Result Message

  function leaderboardResultMessage(DbReference,channelObject,client) {
      console.log("leaderboard reasult message called");
    var topListNumber = 2; // represent the number of top results to display
    var date_ob = new Date();
    var ChannelId = channelObject.id;
    var leaderBoardListArray=[];
    var presentYear = date_ob.getFullYear();
    var presentMonth = date_ob.getMonth()+1;
    var presentDay = date_ob.getDate();
    var presentChannelDb = DbReference.ref("/LeaderBoard/"+presentYear+"/"+presentMonth+"/"+presentDay+"/"+ChannelId);
    presentChannelDb.on("value",function(channel){
      channel.forEach(student=>{
        let studentID = student.key;
        
        let studentName = client.users.cache.get(studentID).username
        
        let score = student.val().Score;
        
        leaderBoardListArray.push({studentName,score});
        
      })
      leaderBoardListArray.sort((a,b)=>(a.score < b.score) ? 1 : -1);
      
      var listoftopStudents = leaderBoardListArray.slice(0,topListNumber);
      
        const leaderEmbed = new Discord.MessageEmbed()
                        .setColor("#c0392b")
                        .setTitle(`Course LEADERBOARD`)
      
                        .addFields(
                            listoftopStudents.map((element,index)=>{
                            return {name: `Rank ${index+1}` , value: `${element.studentName} is at score ${element.score}`}
                          }
                             )
      
                          
                        )
      
                        .setTimestamp();
                        console.log(leaderEmbed);
                        channelObject.send(leaderEmbed);
    })
    
    
  
  
    
  
  }

function returnScore(score,dbToUpdate){
    dbToUpdate.child("Score").set(score);
}


module.exports = {
    InitLeaderBoardDatabase,
    setupLeaderBoardDB,
    CalculateScore,
    CreateLeaderBoardDBServer,
    GetPreviousDate,
    InitDefaultLeaderBoard,
    MakeCopyOfLeaderBoard,
    CalculateStreak,
    leaderBoardScheduler,
    saveToLeaderBoard,
    leaderboardResultMessage
}



// How to use 
//leaderboardmodule.InitLeaderBoardDatabase(adminDatabase); its firebase db reference
            //leaderboardmodule.MakeCopyOfLeaderBoard();
            // studentData = new LeaderBoardStudentData();
            // studentData.ChannelId = "12";
            // studentData.StudentId = 30;
            // studentData.Score = leaderboardmodule.CalculateScore();
            // leaderboardmodule.setupLeaderBoardDB(studentData);
            // leaderboardmodule.CreateLeaderBoardDBServer();
            //leaderboardmodule.GetPreviousDate();