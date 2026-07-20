import mongoose from "mongoose";    


const productSchema = new mongoose.Schema({
    productId:{
        type: String,
        required: true,
        unique: true,
    },
    name:{
        type: String,   
        required: true,
    },
    altName: [{
        type: String,   
        
    } ],

    price: {
        type: Number,
        required: true,
    }, 
    
    
    description: {
        type: String
        } ,

    image: [
        { 
        type: String   
        }
        ],

    labalPrice: {
        type: Number,   
        required: true,
    },

    stock: {
        type: Number,
        required: true,
    },

    isAvailable: {
        type: Boolean,
        required: true,
        default: true,
    },


   

});



const product = mongoose.model('Product', productSchema);




export default product;  