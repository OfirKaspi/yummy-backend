import express, { Request, Response } from "express"
import cors from "cors"
import { configureCloudinary } from './config/cloudinary'

import myUserRoute from './routes/MyUserRoute'
import myRestaurantRoute from './routes/MyRestaurantRoute'
import restaurantRoute from './routes/RestaurantRoute'
import orderRoute from './routes/OrderRoute'

configureCloudinary()

const app = express()

app.use(cors())
app.use("/api/order/checkout/webhook", express.raw({ type: "*/*" }))
app.use(express.json())

app.get("/health", async (req: Request, res: Response) => {
  res.send({ message: "health OK!" })
})

app.use("/api/my/user", myUserRoute)
app.use("/api/my/restaurant", myRestaurantRoute)
app.use("/api/restaurant", restaurantRoute)
app.use("/api/order", orderRoute)

export default app
