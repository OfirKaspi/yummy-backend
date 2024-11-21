import { Request, Response } from "express"
import Stripe from "stripe"
import Restaurant, { MenuItemType } from "../models/restaurant"
import Order from "../models/order"

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string)
const FRONTEND_URL = process.env.FRONTEND_URL as string
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
const CURRENCY = "usd"

type CheckoutSessionRequest = {
    cartItems: {
        _id: string
        name: string
        quantity: string
        imageUrl: string
        price: string
    }[]
    deliveryDetails: {
        email: string
        name: string
        addressLine1: string
        city: string
        country: string
    }
    restaurantId: string
}

const getMyOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order
            .find({ user: req.userId })
            .populate("restaurant")
            .populate("user")

        res.json(orders)
    } catch (error) {
        console.log("Error: ", error)
        res.status(500).json({ message: "Error getting my orders" })
    }
}

const stripeWebhookHandler = async (req: Request, res: Response) => {
    let event
    try {
        const sig = req.headers["stripe-signature"]
        event = STRIPE.webhooks.constructEvent(
            req.body,
            sig as string,
            STRIPE_ENDPOINT_SECRET
        )
    } catch (error: any) {
        console.log("Error verifying webhook:", error)
        return res.status(400).json({ message: `Webhook error: ${error.message}` })
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId

        if (!orderId) {
            console.error("Error: Order ID missing in metadata.")
            return res.status(400).json({ message: "Order ID missing in Stripe metadata." })
        }

        try {
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                { status: "paid", totalAmount: session.amount_total },
                { new: true }
            )

            if (!updatedOrder) {
                throw new Error(`Order withID ${orderId} not found.`)
            }

            console.log("Order updated successfully:", updatedOrder)
        } catch (error: any) {
            console.log("Error updating order:", error.message)
            return res.status(500).json({ message: "Error updating order after payment" })
        }
    }
    res.status(200).send()
}

const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        console.log("req.body", req.body)

        const checkoutSessionRequest: CheckoutSessionRequest = req.body
        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }

        const restaurantMenuItems = restaurant.menuCategories.flatMap(category => category.menuItems)

        const lineItems = createLineItems(checkoutSessionRequest, restaurantMenuItems)

        const newOrder = new Order({
            restaurant: restaurant._id,
            user: req.userId,
            status: "placed",
            deliveryDetails: checkoutSessionRequest.deliveryDetails,
            cartItems: checkoutSessionRequest.cartItems,
            totalAmount: lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0),
            createdAt: new Date(),
        })

        await newOrder.save()

        const session = await createSession(
            lineItems,
            restaurant.deliveryPrice,
            newOrder._id.toString()
        )

        if (!session.url) {
            return res.status(500).json({ message: "Error creating stripe session" })
        }

        res.json({ url: session.url })
    } catch (error: any) {
        console.log("Error: ", error)
        res.status(500).json({ message: error.raw?.message || "Internal Server Error" })
    }
}

const createLineItems = (
    checkoutSessionRequest: CheckoutSessionRequest,
    menuItems: MenuItemType[]
) => {
    const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
        const menuItem = menuItems.find((item) => item._id.toString() == cartItem._id.toString())
        if (!menuItem) {
            throw new Error(`Menu item not found: ${cartItem._id}`)
        }
        return {
            price_data: {
                currency: CURRENCY,
                unit_amount: menuItem.price,
                product_data: {
                    name: menuItem.name
                }
            },
            quantity: parseInt(cartItem.quantity)
        }
    })

    return lineItems
}

const createSession = async (
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    deliveryPrice: number,
    orderId: string
) => {
    const sessionData = await STRIPE.checkout.sessions.create({
        line_items: lineItems,
        shipping_options: [
            {
                shipping_rate_data: {
                    display_name: "Delivery",
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: deliveryPrice,
                        currency: CURRENCY
                    }
                }
            }
        ],
        mode: "payment",
        metadata: {
            orderId
        },
        success_url: `${FRONTEND_URL}/order-status?success=true`,
        cancel_url: `${FRONTEND_URL}/order-status?cancelled=true`,
    })
    return sessionData
}

export default {
    createCheckoutSession,
    stripeWebhookHandler,
    getMyOrders,
}
