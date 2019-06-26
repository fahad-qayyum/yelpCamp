var mongoose = require("mongoose");

var yelpSchema = new mongoose.Schema({
    name : String,
    img : String,
    desc : String,
    comments : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Comment"
        }]
});
var campGrounds = mongoose.model("camp",yelpSchema);
module.exports = campGrounds;

