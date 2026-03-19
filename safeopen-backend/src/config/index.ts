import dotenv from 'dotenv'
dotenv.config()

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Supabase
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_ANON_KEY || '',

    // Redis
    redisUrl: process.env.REDIS_URL || '',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

    // External APIs
    virusTotalApiKey: process.env.VIRUSTOTAL_API_KEY || '',
    urlScanApiKey: process.env.URLSCAN_API_KEY || '',
    securityTrailsApiKey: process.env.SECURITYTRAILS_API_KEY || '',
    abuseIpdbApiKey: process.env.ABUSEIPDB_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    maxmindLicenseKey: process.env.MAXMIND_LICENSE_KEY || '',

    // AWS S3
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    awsS3Bucket: process.env.AWS_S3_BUCKET || '',
    awsRegion: process.env.AWS_REGION || 'us-east-1',

    // Frontend
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
} as const
