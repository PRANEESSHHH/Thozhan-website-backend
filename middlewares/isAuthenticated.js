import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        // Check for token in cookies (for local development) or Authorization header (for production cross-origin)
        let token = req.cookies.token;

        // If no cookie token, check Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }

        console.log('Auth check - Token exists:', !!token, 'Source:', req.cookies.token ? 'cookie' : 'header');

        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            })
        }

        const decode = await jwt.verify(token, process.env.SECRET_KEY);
        console.log('Auth check - Token decoded:', !!decode, 'User ID:', decode?.userId);

        if(!decode){
            return res.status(401).json({
                message:"Invalid token",
                success:false
            })
        };

        req.id = decode.userId;
        next();
    } catch (error) {
        console.log('Authentication error:', error.message);
        return res.status(401).json({
            message: "Authentication failed",
            success: false,
            error: error.message
        });
    }
}
export default isAuthenticated;