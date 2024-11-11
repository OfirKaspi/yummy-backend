import express from "express"
import multer from "multer"

import MyRestaurantController from "../controllers/MyRestaurantController"
import { jwtCheck, jwtParse } from "../middlewares/auth"
import { validateMyRestaurantRequest } from "../middlewares/validation"

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 5 * 1024 * 1024 //5mb
    }
}).any()

router.get("/", jwtCheck, jwtParse, MyRestaurantController.getMyRestaurant)
router.post("/", upload, validateMyRestaurantRequest, jwtCheck, jwtParse, MyRestaurantController.createMyRestaurant)
router.put("/", upload, validateMyRestaurantRequest, jwtCheck, jwtParse, MyRestaurantController.updateMyRestaurant)

router.patch("/order/:orderId/status", jwtCheck, jwtParse, MyRestaurantController.updateOrderStatus)
router.get("/order", jwtCheck, jwtParse, MyRestaurantController.getMyRestaurantOrders)

export default router