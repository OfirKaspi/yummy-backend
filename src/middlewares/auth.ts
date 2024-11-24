import { NextFunction, Request, Response } from "express"
import { auth } from "express-oauth2-jwt-bearer"
import jwt from "jsonwebtoken"
import User from "../models/user"

declare global {
    namespace Express {
        interface Request {
            userId: string
            auth0Id: string
        }
    }
}

export const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: "RS256",
})

export const jwtParse = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers

    if (!authorization?.startsWith("Bearer")) {
        return res.status(401).json({ message: "Unauthorized: Missing token" })
    }

    const token = authorization.split(" ")[1]

    try {
        const decoded = jwt.decode(token) as jwt.JwtPayload

        if (!decoded?.sub) {
            return res.status(401).json({ message: "Invalid token" })
        }

        req.auth0Id = decoded.sub
        next()
    } catch (error) {
        console.error("Error parsing JWT:", error)
        return res.status(500).json({ message: "Server error while parsing token" })
    }
}
