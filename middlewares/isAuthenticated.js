import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        console.log('Auth check - Token exists:', !!token);
        
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