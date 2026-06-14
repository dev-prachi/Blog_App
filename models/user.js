const { createHmac, randomBytes} = require('crypto');

const {mongoose,Schema, model}= require("mongoose");
const { createTokenForUser } = require('../services/authentication');

const userSchema= new Schema({
    fullName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    salt:{
        type:String,
        
    },
    password:{
        type:String,
        required:true,

    },
    profileImageURL:{
        type:String,
        default:"/images/default.png",
    },
    role:{
        type:String,
        enum:["USER", "ADMIN"],
        default:"USER",
    },
},

{timestamps: true}

);

userSchema.pre("save", function (next){
    const user= this;  // this poniting to current user

    if(!user.isModified("password")) return next(); // if path password not midified by user then return

    const salt= randomBytes(16).toString();
    // const salt= randomBytes(16).toString();
                        // salt  is a  random string of 16 byts size (salt is a secret key for diff users , diff key )
    const hashedPassword= createHmac("sha256", salt)      // changing passuser plain password into hash value 
    // with "sha256" algo and a secret key "salt"
        .update(user.password)
        .digest("hex");

    this.salt= salt;
    this.password= hashedPassword;

    //next();
});

userSchema.static("matchPasswordAndGenerateToken", async function(email, password){
    const user = await this.findOne({email});
    if(!user) throw new Error("User not found!");
    // console.log(user);
    
    const salt= user.salt;
    const hashedPassword= user.password;

    const userProvidedHash= createHmac("sha256", salt)
        .update(password)
        .digest("hex");

    if(hashedPassword !== userProvidedHash)throw new Error('Incorrect password'); 
    
    const token= createTokenForUser(user);
    return token;


});

const User= model("user", userSchema);

module.exports=User;