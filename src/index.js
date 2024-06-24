import dotenv from "dotenv";
dotenv.config(); // {
//   path: "./.env",
// }
import connectDB from "./db/connections.js";
import { app } from "./app.js";

const port = process.env.PORT || 6000;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at port : ${port}`);
    });
  })
  .catch((er) => {
    console.log("Mongo db connection error ", er);
  });
