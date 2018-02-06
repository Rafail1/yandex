const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const StatsSchema = new Schema({
    client:String,
    companyName:String,
    companyId:String,
    url:String,
    clicks:Number,
    depth: Number,
    reportEmail:String,
});