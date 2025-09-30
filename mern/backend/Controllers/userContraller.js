const User = require("../Model/userModel");
const bcrypt = require("bcryptjs");

//Display...
    const getAllusers = async (req, res, next) =>{
        let users;
    //get all user
        try{
            users = await User.find();
        }catch (err){
            console.log(err);
        }
    //not found
        if(!users){
            return res.status(404).json({message:"user not found"});
        }
    //Display All users 
        return res.status(200).json({users});
    };



//insert...
    const addUser = async (req, res, next) =>{
        const {name,email,nic,phoneno,district,password} = req.body;

        let user;

        try{
            // ===== PASSWORD HASHING (bcrypt) =====
            // If a plain-text password is provided, hash it before saving to the database.
            // This prevents storing plain-text passwords and keeps user accounts secure.
            let hashedPassword = password;
            if (typeof password === 'string' && password.length > 0) {
                const looksHashed = /^\$2[aby]\$/.test(password);
                if (!looksHashed) {
                    hashedPassword = await bcrypt.hash(password, 10);
                }
            }

            user = new User({name,email,nic,phoneno,district,password: hashedPassword});
            await user.save();
        }catch (err){
            console.log(err);
        }

        //not insert user data
        if(!user){
            return res.status(404).json({massage:"unable to add user"});
        }
        return res.status(200).json({user});
    };


//get user by id...
const getById = async (req, res, next) =>{
    const id = req.params.id;

    let user;

    try{
        user = await User.findById(id);
    }catch (err){
        console.log(err);
    }

    if(!user){
         return res.status(404).json({massage:"unable to add user"});
    }
    return res.status(200).json({user});
};


//update user deatils...
const updateUser = async (req, res, next) =>{
    const id = req.params.id;
    const {name,email,nic,phoneno,district,password} = req.body;

    try{
        const update = { name, email, nic, phoneno, district };
        if (typeof password === 'string' && password.length > 0) {
            // ===== PASSWORD HASHING (bcrypt) on update =====
            // Only hash and set the password if a new one was provided.
            const looksHashed = /^\$2[aby]\$/.test(password);
            update.password = looksHashed ? password : await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(id, update, { new: true });
        if(!user){
            return res.status(404).json({massage:"unable to Update"});
        }
        return res.status(200).json({user});
    }catch (err){
        console.log(err);
        return res.status(400).json({massage:"unable to Update"});
    }
};



//Delete User....
const deleteUser = async (req, res, next) =>{
    const id = req.params.id;

    let user;

    try{
        user = await User.findByIdAndDelete(id)
    }catch (err){
        console.log(err);
    }

    if(!user){
         return res.status(404).json({massage:"unable to Delete"});
    }
    return res.status(200).json({user});
};   
exports.getAllusers = getAllusers;
exports.addUser = addUser;
exports.getById = getById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;