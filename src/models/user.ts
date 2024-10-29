import mongoose from "mongoose"

const addressSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    addressLine1: { type: String },
    city: { type: String },
    country: { type: String }
})

const userSchema = new mongoose.Schema({
    auth0Id: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String },
    addresses: [addressSchema],
    favoriteRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }]
})

const User = mongoose.model('User', userSchema)
export default User
