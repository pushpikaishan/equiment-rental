const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{type:String, required:true},
    email:{type:String,required:true},
    nic:{type:String, required:true},
    phoneno:{type:Number, required:true},
    district:{type:String,required:true},
    password:{type:String , required:true},
    role: { type: String, default: "user" }, 
    profileImage: { type: String, default: "" }

});

module.exports = mongoose.model("user",userSchema)
