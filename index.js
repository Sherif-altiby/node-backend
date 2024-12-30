import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt"
import connectDB from "./connectDB.js";
import Questionnaire from "./model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from 'url';
 
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/; 
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      return cb(new Error("Only JPEG, JPG, and PNG files are allowed!"));
    }
  },
});


app.get("/", async (req, res) => {
 
    try{

        const questionnaire = await Questionnaire.findOne({});

        if(!questionnaire){
 
            return res.status(500).json({
                message: "No questionnaire avalible",
                status: false,
            });
             
        }

        return res.status(200).json({
            message: "questionnaire is avalible",
            questionnaire,
            status: true,
        })

    }catch(err){
 
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
            status: false,
        });

    }

})


app.post("/register", upload.single("image"), async (req, res) => {

    const { name, email, password } = req.body;

    const imagePath = req.file ? req.file.path : null;

    console.log(imagePath);

    try{
       
        const user = await Questionnaire.findOne({"users.email": email});

        if(user){
            return res.status(400).json({
                message: "User is alredy exist",
                status: false
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            image: imagePath
        };

        const questionnaire = await Questionnaire.findOneAndUpdate(
            {}, 
            { $push: { users: newUser } },
            { upsert: true, new: true }
        );

        const createdUser = questionnaire.users.find(user => user.email === email);

        return res.status(201).json({
            message: "user created successfully",
            data: createdUser,
            status: true
        })

    }catch(err){

        return res.status(500).send({
            message: err.message,
            status: false
        })

    }
});


app.post("/login", async (req, res) => {

    const {  email, password } = req.body;

    try{
       
        const questionnaire = await Questionnaire.findOne({ "users.email": email });
        if (!questionnaire) {
        return res.status(404).json({ 
            message: "User not found",
            status: false
         });
        }


        const user = questionnaire.users.find((user) => user.email === email);
        if (!user) {
        return res.status(404).json({ 
            message: "User not found",
            status: false
         });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
          return res.status(401).json({ 
            message: "Invalid credentials",
            status: false
         });
        }

        res.status(200).json({
            message: "Login successful",
            user,
            status: true
        });

    }catch(err){

        return res.status(500).send({
            message: err.message,
            status: false
        })

    }
});


app.post('/rate/:id', async (req, res) => {
    try {
      const { id } = req.params; 
      const { rating } = req.body; 
  
      const questionnaire = await Questionnaire.findOne({ "users._id": id });
  
      if (!questionnaire) {
        return res.status(404).json({ 
          message: "User not found",
          status: false,
        });
      }
  
      const user = questionnaire.users.find(user => user._id.toString() === id);
  
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          status: false,
        });
      }
  
      user.lastAverage = user.currentAverage;
  
      user.rates.push(rating);
  
      user.currentAverage =
        user.rates.reduce((sum, rate) => sum + rate, 0) / user.rates.length;
  
      await questionnaire.save();
  
      return res.status(200).json({
        message: "Rating added successfully",
        data: user,
        status: true,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Internal server error",
        status: false,
        error: err.message,
      });
    }
});


app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file ? req.file.path : null;

    if (!imagePath) {
      return res.status(400).json({
        message: "Image file is required",
        status: false,
      });
    }

    const existingDocument = await Questionnaire.findOne({});

    if (existingDocument && existingDocument.image) {
      if (fs.existsSync(existingDocument.image)) {
        fs.unlinkSync(existingDocument.image);
      }
    }

    const updatedQuestionnaire = await Questionnaire.findOneAndUpdate(
      {},
      { image: imagePath },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Image uploaded successfully",
      data: updatedQuestionnaire,
      status: true,
    });

  } catch (err) {

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
      status: false,
    });

  }
});


app.post("/add-question", async (req, res) => {
 
    try{

        const { question } = req.body;

        const questionnaire = await Questionnaire.findOneAndUpdate(
            {},
            { question: question },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            message: "Qusrion added successfully",
            questionnaire,
            status: true,
        })

    }catch(err){

        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
            status: false,
          });

    }

});


app.post("/add-answer/:id", async (req, res) => {
    try {
      const { id } = req.params;  
      const { answer } = req.body;  
  

      if (!answer) {
        return res.status(400).json({
          message: "Answer is required",
          status: false,
        });
      }
  

      const user = await Questionnaire.findOneAndUpdate(
        { "users._id": id }, 
        { $set: { "users.$.answer": answer } },  
        { new: true }  
      );
  

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          status: false,
        });
      }
  

      return res.status(200).json({
        message: "Answer added successfully",
        user,
        status: true,
      });

    } catch (error) {

        return res.status(500).json({
        message: "Internal server error",
        error: error.message,
        status: false
        });

    }
});


app.post('/active-questionnaire', async (req, res) => {
 
    try{

        const { status } = req.body

        const questionnaire = await Questionnaire.findOneAndUpdate(
            {},
            { status: status },
            { upsert: true, new: true }
        )

        return res.status(200).json({
            message: "Qusrion activated successfully",
            questionnaire,
            status: true,
        })

    }catch(err){

        return res.status(500).json({
        message: "Internal server error",
        error: err.message,
        status: false
        });
         
    }

})

app.post('/upload-link', async (req, res) => {
 
  try{

    const { title, value } = req.body;

    const link = {
      title,
      value
    }

    const questionnaire = await Questionnaire.findOneAndUpdate(
      {}, 
      { $push: { links: link } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Link added successfully",
      status: true,
      questionnaire
    })

  }  catch(err){
 
    return res.status(500).json({
       message: "Internal server error",
       error: err.message,
       status: false
    });

  }

})

const PORT = process.env.PORT;

connectDB().then(() => {

    app.listen(PORT, () => {
        console.log("The app is running")
    })

})