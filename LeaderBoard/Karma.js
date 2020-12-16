const users = [];

var updateKarma = function(guild, database, msg) {

	console.log(msg);

	if(msg.mentions.users.size >= 1){
		msg.mentions.users.forEach(user => {			
			updateKarmaPoints(msg, user.id);
		});
	} else {
            
		var tag = `<@!${msg.author.id}>`;
		msg.channel.send(`${tag}\nHey - looks like you are thanking someone who might have helped you! If you would like them to get a karma point please use "thanks @username" format.`);
	
	}
}

function updateKarmaPoints(msg, mention){

	if(msg.author.id === mention){

		printKarmaMessage(msg, createTag(mention), true);

	} else {

		// Fetch users index from users object.
		var userIndex = users.findIndex((users) => users.id === mention);
		
		
		if(userIndex >= 0){							// If the user exists in the database then.....
			users[userIndex].karma_points++;		// .....update its karma points
		} else {									// Otherwise ...
			var newUser = {							// ....create a new user
				"id": mention,
				"karma_points" : 1
			};
			users.push(newUser);					// and append to users object.
		}
			
		printKarmaMessage(msg, createTag(mention), false);

	}
	
}

function createTag(mention){ return `<@!${mention}>`; }

function printKarmaMessage(msg, tag, isAssigningThemselves){
	if(isAssigningThemselves){
	
		msg.channel.send(`${tag} don't be a smart a**. You get 0 points. <:sunglasses:788659919867215903>`);
	
	} else {
		
		msg.channel.send(`${tag} you get +1 Karma points.`);
	
	}

}


var getKarma = function(mention){
	var user = users.find((users) => users.id === mention);

	return (user == null) ? "0" : user.karma_points;
}

module.exports = {
	updateKarma,
	getKarma
};