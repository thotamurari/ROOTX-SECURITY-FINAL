import { Schema, model } from 'mongoose'

const ScanSchema = new Schema({
  userId: String,
  scannedAt: { type: Date, default: Date.now },
  scanType: String,
  input: String,
  threatLevel: String,
  riskScore: Number
}, { timestamps: true })

export const ScanModel = model('Scan', ScanSchema)
