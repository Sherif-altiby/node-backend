import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectDB() {

    try{

        await mongoose.connect(process.env.MONOGODBURL)
        console.log("MongoDB is connected");

    }catch(error){

        console.log("MongoDB connect error", error);
        process.exit(1)

    }
    
};

export default connectDB;