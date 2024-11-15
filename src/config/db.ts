import mongoose from "mongoose"

export const connectToDatabase = async (): Promise<void> => {
  const connectionString = process.env.MONGODB_CONNECTION_STRING

  if (!connectionString) {
    throw new Error("MONGODB_CONNECTION_STRING is not defined in the environment")
  }

  await mongoose.connect(connectionString)
  console.log("Database connected successfully")
}
