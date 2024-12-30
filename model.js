import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
  },
  question: {
     type: String
  },
  links: [
    {
      title: {
        type: String,
      },
      value: String
    }
  ],
  users: [
    {
      name: {
        type: String,
        required: true, 
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      rates: {
        type: [Number], 
        default: [], 
      },
      lastAverage: {
         type: Number,
         default: 0 
      }, 
      currentAverage: { 
        type: Number, 
        default: 0 
      },
      image: {
        type: String, 
        default: null, 
      },
      answer: {
        type: String,
      }
    },
  ],
});

const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);

export default Questionnaire;
