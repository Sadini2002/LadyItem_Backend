import express from "express";
import mongoose from "mongoose";    


const userSchema = mongoose.Schema({
    email: {    
        type: String,
        required: true,
        unique: true    
    },
    firstname: {    
        type: String,
        required: true  
    },
    lastname: { 
        type: String,
        required: true  
    },
    password: {
        type: String,       
        required: true
    },

    role: {
        type: String,
        required: true,
        //default: 'customer'
    },

    isBlock : {
        type: Boolean,
        required: true,
        default: false
    },
    img : { 
        type: String,
        required: false,
        default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg'   
        
    }

    
});
const user = mongoose.model('User', userSchema);


export default user;    