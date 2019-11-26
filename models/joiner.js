var mongoose = require('mongoose');

var joinerSchema = new mongoose.Schema({
    salutation: String,
    fullName: String,
    company: String,
    username: String,
    regNo: String,
    mobile: String
});

// Create module imported by other pages
module.exports = mongoose.model("Joiner", joinerSchema);
