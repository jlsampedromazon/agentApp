var mongoose                = require('mongoose'),
    passportLocalMongoose   = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String
})

// Add methods to schema
userSchema.plugin(passportLocalMongoose);

// Create module imported by other pages
module.exports = mongoose.model("User", userSchema);