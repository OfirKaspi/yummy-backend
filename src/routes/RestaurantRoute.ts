import express from "express";

import RestaurantController from "../controllers/RestaurantController";
import { validateCity } from "../middlewares/validation";

const router = express.Router()

router.get("/search/:city", validateCity, RestaurantController.searchRestaurant)

export default router