import { NextFunction, Request, Response } from "express"
import { body, param, validationResult } from "express-validator"

const handleValidationErrors = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    next()
}

export const validateMyUserRequest = [
    body("name")
        .optional()
        .isString()
        .withMessage("Name must be a string"),

    body("addressLine1")
        .optional()
        .isString()
        .withMessage("AddressLine1 must be a string"),

    body("country")
        .optional()
        .isString()
        .withMessage("Country must be a string"),

    body("city")
        .optional()
        .isString()
        .withMessage("City must be a string"),

    handleValidationErrors,
]

export const validateMyRestaurantRequest = [
    body("restaurantName")
        .optional()
        .notEmpty()
        .withMessage("Restaurant name must be a non-empty string"),

    body("city")
        .optional()
        .notEmpty()
        .withMessage("City is required"),

    body("country")
        .optional()
        .notEmpty()
        .withMessage("Country is required"),

    body("deliveryPrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Delivery price must be a positive number"),

    body("estimatedDeliveryTime")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Estimated delivery time must be a positive integer"),

    body("cuisines")
        .optional()
        .isArray()
        .withMessage("Cuisines must be an array")
        .not()
        .isEmpty()
        .withMessage("Cuisines array cannot be empty"),

    body("menuCategories")
        .optional()
        .isArray()
        .withMessage("Menu categories must be an array"),

    body("menuCategories.*.name")
        .optional()
        .notEmpty()
        .withMessage("Each category must have a name"),

    body("menuCategories.*.menuItems")
        .optional()
        .isArray()
        .withMessage("Each category's menu items must be an array"),

    body("menuCategories.*.menuItems.*.name")
        .optional()
        .notEmpty()
        .withMessage("Each menu item must have a name"),

    body("menuCategories.*.menuItems.*.price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Each menu item price must be a positive number"),

    handleValidationErrors,
]


export const validateParam = (paramName: string) => [
    param(paramName)
        .isString()
        .trim()
        .notEmpty()
        .withMessage(`${paramName} parameter must be a valid string`)
]