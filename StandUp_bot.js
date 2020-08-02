const Discord = require('discord.js');
const { MessageEmbed} = require('discord.js');
var schedule = require('node-schedule');


const client = new Discord.Client();

const token = '';

const channelIDs = ["737605954543026186","737345446078316606"]   // enter channelID for standUp - you can get channel id by the command !channelID


function startStandUp(channelID){
   
     console.log(channelID);
    const channel = client.channels.cache.get(channelID);
    channelName = channel.name;
  
    let users = channel.members;  // get the all users of channel
    
    const stantUpStartMessage = new MessageEmbed()
      // Set the title of the field
      .setTitle(`Reminder for Daily Standup`)
      // Set the color of the embed
      .setColor(0x16a085)
      // Set the main content of the embed
      .setDescription("start by command 'start'" );

       users.forEach(users=>{
        
        if(!users.user.bot){
            users.send(stantUpStartMessage).catch(console.error);
        }
         
       })  // sending message to each member of the channel to start standup
        
    
}


function standUpReminder(channelID){

    const channel = client.channels.cache.get(channelID);
  
    let users = channel.members;  // get the all users of channel

    const stantUpStartMessage = new MessageEmbed()
      // Set the title of the field
      .setTitle('Standup Reminder')
      // Set the color of the embed
      .setColor(0x16a085)
      // Set the main content of the embed
      .setDescription("start by command '!standUp' ");

      // users need to filter out as per role

       users.each(users=> users.send(stantUpStartMessage).catch(console.error)); // sending message to each member of the channel to start standup
}



client.on('ready', ()=>{
    console.log("this bot is online");
    schedule.scheduleJob('41 11 * * *', function(){ // set time for standup more on https://www.npmjs.com/package/node-schedule
        console.log('The answer to life, the universe, and everything!');
        channelIDs.forEach(channelID=>{
            startStandUp(channelID);  
          })
         
      });
    
      channelIDs.forEach(channelID=>{
        startStandUp(channelID);  
      })
       
    
})



client.on('message',async (message)=>{
    const msg = message.content.toLowerCase();
    if(msg == '!channelid'){
        message.reply(message.channel.id);
    }

  

    if (msg.startsWith('start')) {
        let answers={
            did :"",
            plan :"",
            problem :""
        }
        message.channel.send("what you did today");
       
        const filter = m => !m.author.bot;
        // Errors: ['time'] treats ending because of the time limit as an error
       
        message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected =>{
                answers.did = collected.first().content
                message.channel.send("What are you planning on doing tomorrow ?");  
            })
        .then(collected=>{
            message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected =>{
                answers.plan = collected.first().content
                message.channel.send("facing any problem ?");
                 
            }).then(collected=>{
                message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                .then(collected =>{
                    answers.problem = collected.first().content
                    message.channel.send("All done! Congrats for maintaining a streak for X days!");

                    //message embed
                    const myGuild = client.guilds.cache.get('736892439868080130');
                    const user = myGuild.members.cache.get(message.author.id);
                    const ChannelName = user.roles.cache.first().name;
                    const destinationChannel = myGuild.channels.cache.find(channel => channel.name == channelName);

                    const updateEmbed = new Discord.MessageEmbed()
                            .setColor('#0099ff')
                            .setTitle(`${message.author.username} progress updates`)
                            
                            .addFields(
                                { name: 'What did you do today?', value: answers.did },
                                { name: 'What are you planning on doing tomorrow?', value: answers.plan },
                                { name: 'Where do you need help?', value: answers.problem },
                                
                            )
                            
                            .setTimestamp()
                            destinationChannel.send(updateEmbed);

                    console.log(answers);
                }).catch(collected => message.channel.send(`timeout start again with command "start"`))
            }).catch(collected => message.channel.send(`timeout start again with command "start" `))
             
        }).catch(collected => message.channel.send(`timeout start again with command "start"`))
        
        

      }

      
})


client.login(token);





