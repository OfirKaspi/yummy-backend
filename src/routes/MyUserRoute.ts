import express from "express"
import MyUserController from "../controllers/MyUserController"
import { jwtCheck, jwtParse } from "../middlewares/auth"
import { validateMyUserRequest } from "../middlewares/validation"

const router = express.Router()

router.post("/", jwtCheck, jwtParse, MyUserController.fetchOrCreateUser)
router.put("/", jwtCheck, jwtParse, validateMyUserRequest, MyUserController.updateUser)
router.delete("/", jwtCheck, jwtParse, MyUserController.deleteUser)

export default router