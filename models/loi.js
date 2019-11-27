var mongoose = require('mongoose');

// Create LOI Input Schema
var loiSchema = new mongoose.Schema({
    address: String,
    landlordName: String,
    tenantName: String,
    landlordId: String,
    tenantId: String,
    rentAmount: String,
    leasePeriod: String,
    diplo: String,
    bank: String,
    account: String,
    startDate: Date,
    fullText: String,
    agent: Object,
    created: { type: Date, default: Date.now }

})

// Create module imported by other pages
module.exports = mongoose.model("Loi", loiSchema);
