import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: String,
  username: String,
  password: String,
  races: Number,
  averageWPM: Number,
  averageAccuracy: Number,
  fastestRace: Number,
  profilePicture: String,
});

export default mongoose.model("Player", playerSchema, "players");
