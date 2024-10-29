import { NextFunction, Request, Response } from "express"
import User from "../models/user"

const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUser = await User.findOne({ _id: req.userId })
            .populate("favoriteRestaurants")
            .populate("orders")

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json(currentUser)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error getting user" })
    }
}

const createCurrentUser = async (req: Request, res: Response) => {
    try {
        const { auth0Id, email } = req.body
        const existingUser = await User.findOne({ auth0Id })

        if (existingUser) return res.status(200).send()

        const newUser = new User({ auth0Id, email })
        await newUser.save()

        res.status(201).json(newUser.toObject())
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error creating user" })
    }
}

const updateCurrentUser = async (req: Request, res: Response) => {
    try {
        const { name, addresses, favoriteRestaurantId } = req.body

        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (name) {
            user.name = name
        } else if (addresses) {
            user.addresses = addresses
        } else if (favoriteRestaurantId) {
            const index = user.favoriteRestaurants.indexOf(favoriteRestaurantId)
            if (index === -1) {
                user.favoriteRestaurants.push(favoriteRestaurantId)
            } else {
                user.favoriteRestaurants.splice(index, 1)
            }
        }

        await user.save()
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error updating user" })
    }
}

export default {
    getCurrentUser,
    createCurrentUser,
    updateCurrentUser,
}
