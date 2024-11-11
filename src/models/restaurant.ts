import mongoose, { InferSchemaType } from "mongoose"

const menuItemSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: () => new mongoose.Types.ObjectId()
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
})

export type MenuItemType = InferSchemaType<typeof menuItemSchema>

const menuCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    menuItems: {
        type: [menuItemSchema],
        required: true
    }
})

export type MenuCategoryType = InferSchemaType<typeof menuCategorySchema>

const restaurantSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    restaurantName: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    deliveryPrice: { type: Number, required: true },
    estimatedDeliveryTime: { type: Number, required: true },
    cuisines: [{ type: String, required: true }],
    menuCategories: { type: [menuCategorySchema], required: true },
    imageUrl: { type: String, required: true },
    lastUpdated: { type: Date, required: true },
})

const Restaurant = mongoose.model("Restaurant", restaurantSchema)

export default Restaurant