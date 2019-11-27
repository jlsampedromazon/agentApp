var mongoose = require('mongoose');

// Create Agent Schema, including user details
var agentSchema = new mongoose.Schema({
    salutation: String,
    fullName: String,
    agentId: String,
    company: String,
    license: String,
    username: String,
    password: String,
    image: String
})

// Create module imported by other pages
module.exports = mongoose.model("Agent", agentSchema);
