import { Schema, model } from 'mongoose'

const ApkScanSchema = new Schema({
  userId: String,
  scannedAt: { type: Date, default: Date.now },
  completedAt: Date,
  summary: {
    risky: Number,
    safe: Number
  },
  results: [{
    appName: String,
    riskLevel: String
  }]
}, { timestamps: true })

export const ApkScanModel = model('ApkScanSession', ApkScanSchema)
