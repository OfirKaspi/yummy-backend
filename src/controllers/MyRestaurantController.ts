import { Request, Response } from "express"
import cloudinary from "cloudinary"
import mongoose from "mongoose"
import sharp from "sharp"
import { PassThrough } from "stream"

import Restaurant, { MenuCategoryType } from "../models/restaurant"
import Order from "../models/order"

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
    try {
        const optimizedBuffer = await sharp(file.buffer)
            .resize({ width: 800 })
            .toBuffer()

        const uploadStream = (resolve: (url: string) => void, reject: (error: any) => void) =>
            cloudinary.v2.uploader.upload_stream((error, result) => {
                if (error) return reject(error)
                resolve(result?.url || "")
            })

        const bufferStream = new PassThrough()
        bufferStream.end(optimizedBuffer)

        return await new Promise((resolve, reject) => {
            bufferStream.pipe(uploadStream(resolve, reject))
        })
    } catch (error) {
        console.error("Cloudinary upload error:", error)
        throw new Error("Failed to upload image to Cloudinary")
    }
}

const handleMenuItemsImages = async (menuCategories: MenuCategoryType[], files: Record<string, Express.Multer.File>) => {
    for (const category of menuCategories) {
        for (const item of category.menuItems) {
            const fileKey = `menuItem_${item.name.replace(/\s+/g, "")}_image`
            if (files[fileKey]) {
                item.imageUrl = await uploadImage(files[fileKey])
            }
        }
    }
}

const parseFiles = (filesArray: Express.Multer.File[]): Record<string, Express.Multer.File> => {
    return filesArray.reduce((acc, file) => {
        acc[file.fieldname] = file
        return acc
    }, {} as Record<string, Express.Multer.File>)
}

const getMyRestaurant = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.userId })
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" })
        res.json(restaurant)
    } catch (error) {
        console.error("Error fetching restaurant:", error)
        res.status(500).json({ message: "Error getting restaurant" })
    }
}

const createMyRestaurant = async (req: Request, res: Response) => {
    try {
        const existingRestaurant = await Restaurant.findOne({ user: req.userId })
        if (existingRestaurant) return res.status(409).json({ message: "User restaurant already exists" })

        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({ message: "Invalid files format. Expected an array of file fields." })
        }

        const filesObject = parseFiles(req.files as Express.Multer.File[])
        const imageUrl = await uploadImage(filesObject["imageFile"])

        const restaurant = new Restaurant({
            ...req.body,
            imageUrl,
            user: new mongoose.Types.ObjectId(req.userId),
            lastUpdated: new Date()
        })

        if (restaurant.menuCategories) {
            await handleMenuItemsImages(restaurant.menuCategories, filesObject)
        }

        await restaurant.save()
        res.status(201).json(restaurant)
    } catch (error) {
        console.error("Error creating restaurant:", error)
        res.status(500).json({ message: "Error creating restaurant" })
    }
}

const updateMyRestaurant = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.userId })
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" })

        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({ message: "Invalid files format. Expected an array of file fields." })
        }

        const filesObject = parseFiles(req.files as Express.Multer.File[])
        if (filesObject["imageFile"]) {
            restaurant.imageUrl = await uploadImage(filesObject["imageFile"])
        }

        Object.assign(restaurant, req.body, { lastUpdated: new Date() })

        if (req.body.menuCategories) {
            restaurant.menuCategories = req.body.menuCategories
            await handleMenuItemsImages(restaurant.menuCategories, filesObject)
        }

        await restaurant.save()
        res.status(200).json(restaurant)
    } catch (error) {
        console.error("Error updating restaurant:", error)
        res.status(500).json({ message: "Error updating restaurant" })
    }
}

const getMyRestaurantOrders = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.userId })
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" })

        const orders = await Order.find({ restaurant: restaurant._id })
            .populate("restaurant")
            .populate("user")

        res.json(orders)
    } catch (error) {
        console.error("Error fetching restaurant orders:", error)
        res.status(500).json({ message: "Error getting restaurant orders" })
    }
}

const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params
        const { status } = req.body

        const order = await Order.findById(orderId)
        if (!order) return res.status(404).json({ message: "Order not found" })

        const restaurant = await Restaurant.findById(order.restaurant)
        if (!restaurant || restaurant.user?.toString() !== req.userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        order.status = status
        await order.save()
        res.status(200).json(order)
    } catch (error) {
        console.error("Error updating order status:", error)
        res.status(500).json({ message: "Error updating order status" })
    }
}

export default {
    getMyRestaurant,
    createMyRestaurant,
    updateMyRestaurant,
    getMyRestaurantOrders,
    updateOrderStatus,
}
