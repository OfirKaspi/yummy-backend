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
        menuItemId: string
        name: string
        quantity: string
    }[]
    deliveryDetails: {
        email: string
        name: string
        addressLine1: string
        city: string
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
        console.log("Error: ", error)
        return res.status(400).json({ message: `Webhook error: ${error.message}` })
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session

        type SessionMetadata = {
            restaurantId: string;
            userId: string;
            deliveryDetails: string;
            cartItems: string;
        };

        const metadata = session.metadata as SessionMetadata | null;

        if (metadata) {
            const { restaurantId, userId, deliveryDetails, cartItems } = metadata;
            try {
                const newOrder = new Order({
                    restaurant: restaurantId,
                    user: userId,
                    status: "paid",
                    deliveryDetails: JSON.parse(deliveryDetails),
                    cartItems: JSON.parse(cartItems),
                    totalAmount: session.amount_total,
                    createdAt: new Date(),
                });

                await newOrder.save();
                console.log("Order saved successfully after payment confirmation.");
            } catch (error) {
                console.log("Error saving order after payment confirmation: ", error);
                return res.status(500).json({ message: "Error saving order after payment" });
            }
        } else {
            console.log("Error: Metadata is missing in the session.");
            return res.status(400).json({ message: "Metadata missing in Stripe session" });
        }
    }

    res.status(200).send()
}

const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const checkoutSessionRequest: CheckoutSessionRequest = req.body
        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId)
        if (!restaurant) {
            throw new Error("Restaurant not found")
        }

        const restaurantMenuItems = restaurant.menuCategories.flatMap(category => category.menuItems)

        const lineItems = createLineItems(checkoutSessionRequest, restaurantMenuItems)

        const session = await createSession(
            lineItems,
            restaurant.deliveryPrice,
            restaurant._id.toString(),
            req.userId,
            JSON.stringify(checkoutSessionRequest.deliveryDetails),
            JSON.stringify(checkoutSessionRequest.cartItems)
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
        const menuItem = menuItems.find((item) => item._id.toString() == cartItem.menuItemId.toString())
        if (!menuItem) {
            throw new Error(`Menu item not found: ${cartItem.menuItemId}`)
        }
        const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
            price_data: {
                currency: CURRENCY,
                unit_amount: menuItem.price,
                product_data: {
                    name: menuItem.name
                }
            },
            quantity: parseInt(cartItem.quantity)
        }
        return line_item
    })

    return lineItems
}

const createSession = async (
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    deliveryPrice: number,
    restaurantId: string,
    userId: string,
    deliveryDetails: string,
    cartItems: string
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
            restaurantId,
            userId,
            deliveryDetails,
            cartItems
        },
        success_url: `${FRONTEND_URL}/order-status?success=true`,
        cancel_url: `${FRONTEND_URL}/details/${restaurantId}?cancelled=true`,
    })
    return sessionData
}

export default {
    createCheckoutSession,
    stripeWebhookHandler,
    getMyOrders,
}
