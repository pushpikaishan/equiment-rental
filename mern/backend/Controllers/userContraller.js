const User = require("../Model/userModel");

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
            user = new User({name,email,nic,phoneno,district,password});
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
        const user = await User.findByIdAndUpdate(
          id,
          { name, email, nic, phoneno, district, password },
          { new: true }
        );
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