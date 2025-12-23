import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
// const cors = require("cors")

dotenv.config({});

const app = express();

// CORS Configuration - MUST be before other middleware
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173', 
            'http://localhost:5174', 
            'https://thozhan-website-frontend.vercel.app',
            // Add your actual Netlify URL here if different
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false
}

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Other middleware - AFTER CORS
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

// Test endpoint for connectivity
app.get('/api/test', (req, res) => {
    res.json({
        message: "Backend is connected successfully! 🚀",
        timestamp: new Date().toISOString(),
        success: true,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running perfectly for your demo! 🎉',
        port: PORT,
        success: true
    });
});

// api's
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

app.listen(PORT,()=>{
    connectDB();
    console.log(`🚀 Server running at port ${PORT}`);
    console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);
    console.log(`🎯 Ready for your 11:30 AM demo!`);
})