import { Request, Response } from "express"
import User from "../models/user"

const fetchOrCreateUser = async (req: Request, res: Response) => {
    const { auth0Id } = req
    const { email, name } = req.body

    try {
        let user = await User.findOne({ auth0Id }).populate("favoriteRestaurants").populate("orders")

        if (!user) {
            user = new User({
                auth0Id,
                email,
                name,
                addresses: [],
                favoriteRestaurants: [],
                orders: [],
            })
            await user.save()
        }

        res.status(200).json(user)
    } catch (error) {
        console.error("Error fetching or creating user:", error)
        res.status(500).json({ message: "Error getting or creating user" })
    }
}

const updateUser = async (req: Request, res: Response) => {
    const { name, addresses, favoriteRestaurantId } = req.body
    const { auth0Id } = req

    try {
        const user = await User.findOne({ auth0Id })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (name) user.name = name
        if (addresses) user.addresses = addresses
        if (favoriteRestaurantId) {
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
        console.error("Error updating user:", error)
        res.status(500).json({ message: "Error updating user" })
    }
}

const deleteUser = async (req: Request, res: Response) => {
    const { auth0Id } = req
    try {
        const user = await User.findOneAndDelete({ auth0Id })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json({ message: "User deleted successfully" })
    } catch (error) {
        console.error("Error deleting user:", error)
        res.status(500).json({ message: "Error deleting user" })
    }
}

export default {
    deleteUser,
    fetchOrCreateUser,
    updateUser,
}
