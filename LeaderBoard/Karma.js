const users = [];

var updateKarma = function(guild, database, msg) {
	var user = msg.mentions.users.first();

	if(msg.mentions.users.size > 1){
		var mention = msg.mentions.users.first(2)[1].id;
	}
	else{
		var mention = msg.mentions.users.first().id;
	}

	updateKarmaPoints(msg, mention);
}

function updateKarmaPoints(msg, mention){
	
	// Check if users exists in users object.
	var userIndex = users.findIndex((users) => users.id === mention);
	
	// Check if the users exists in the database.
	if(userIndex >= 0){
		// update its karma points
		users[userIndex].karma_points++;
	} 
	// Otherwise ....
	else {
		// ....create a new user
		var newUser = {
			"id": mention,
			"karma_points" : 1
		};
		
		// and append to users object.
		users.push(newUser);
	}
	
	var tag = `<@!${mention}>`;	
	msg.channel.send(`${tag} you get +1 Karma points.`);
	
}

var getKarma = function(mention){
	var user = users.find((users) => users.id === mention);

	return (user == null) ? "0" : user.karma_points;
}

function getUserFromMention(mention) {
	// The id is the first and only match found by the RegEx.
	const matches = mention.match(/^<@!?(\d+)>$/);
	
	// If supplied variable was not a mention, matches will be null instead of an array.
	if (!matches) return;

	// However the first element in the matches array will be the entire mention, not just the ID,
	// so use index 1.
	const id = matches[1];

	console.log(client.users.cache);

	return client.users.cache.get(mention);
	// return client.users.cache.get(id);
}

module.exports = {
	updateKarma,
	getKarma
};