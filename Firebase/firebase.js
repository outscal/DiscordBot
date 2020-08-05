var dotenv = require('dotenv')
var admin = require("firebase-admin");

// access to the json database 
var database;

dotenv.config();

var setupFirebase = function setupFirebase() {
    // Fetch the service account key JSON file contents
    var serviceAccount = require("./discord-bot-50dbc-firebase-adminsdk.json");

    // Initialize the app with a service account, granting admin privileges
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://discord-bot-50dbc.firebaseio.com"
    });

    // As an admin, the app has access to read and write all data, regardless of Security Rules
    var db = admin.database();

    // database = db.ref("/StandupConfig");
    // database.once("value", function(snapshot) {
    //     console.log(snapshot.val());
    // });
    return db;
}

module.exports = {
    setupFirebase,
}