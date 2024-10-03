import express from "express";

import RestaurantController from "../controllers/RestaurantController";
import { validateParam } from "../middlewares/validation";

const router = express.Router()


router.get("/:restaurantId", validateParam("restaurantId"), RestaurantController.getRestaurant)
router.get("/search/:city", validateParam("city"), RestaurantController.searchRestaurant)

export default router