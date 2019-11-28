var mongoose = require('mongoose');

// Create Agent Schema, including user details
var opportunitySchema = new mongoose.Schema({
    created: { type: Date, default: Date.now },
    agent: Object,
    isLandlordAgt: Boolean,
    isLoi: Boolean,
    isLeaseAgt: Boolean,
    oppStatus: Number
})

// Create module imported by other pages
module.exports = mongoose.model("Opportunity", opportunitySchema);
