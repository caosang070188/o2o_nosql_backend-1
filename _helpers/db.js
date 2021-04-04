const config = require('config.json');
const mongoose = require('mongoose');
const connectionOptions = { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };
mongoose.connect(process.env.MONGODB_URI || config.connectionString, connectionOptions);
mongoose.Promise = global.Promise;

mongoose.connection.on("connected", () => {
    console.log("--> Connected to MongoDB")
})

module.exports = {
    Account: require('accounts/account.model'),
    Notification: require("notifications/notification.model"),
    RefreshToken: require('accounts/refresh-token.model'),
    Friends: require('accounts/friends.model'),
    isValidId
};

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}