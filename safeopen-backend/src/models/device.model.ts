import { Schema, model } from 'mongoose'

const DeviceProfileSchema = new Schema({
  userId:             { type: String, required: true, unique: true, index: true },
  deviceId:           String,
  model:              { type: String, default: 'Unknown Device' },
  brand:              { type: String, default: 'Unknown' },
  manufacturer:       { type: String, default: 'Unknown' },
  androidVersion:     { type: String, default: 'Unknown' },
  apiLevel:           { type: String, default: 'Unknown' },
  buildNumber:        String,

  ramTotalGB:         { type: Number, default: 4 },
  ramFreeGB:          { type: Number, default: 1 },
  ramUsedGB:          { type: Number, default: 3 },
  ramUsedPercent:     { type: Number, default: 75 },

  storageTotalGB:     { type: Number, default: 64 },
  storageFreeGB:      { type: Number, default: 10 },
  storageUsedGB:      { type: Number, default: 54 },
  storageUsedPercent: { type: Number, default: 84 },

  batteryPercent:     { type: Number, default: 80 },
  batteryHealth:      { type: Number, default: 85 },
  batteryTemp:        { type: Number, default: 30 },
  isCharging:         { type: Boolean, default: false },

  networkType:        String,
  isConnected:        Boolean,
  carrier:            String,

  installedAppsCount: { type: Number, default: 0 },
  installedApps:      [{ packageName: String, appName: String,
                          versionName: String }],
  riskyAppsCount:     { type: Number, default: 0 },
  dangerousPermsCount:{ type: Number, default: 0 },
  bgProcessCount:     { type: Number, default: 0 },

  topBatteryDrains:   { type: String, default: 'No data yet' },
  cacheGB:            { type: Number, default: 0 },

  timezone:           String,
  lastSynced:         { type: Date, default: Date.now },
  syncCount:          { type: Number, default: 0 },
}, { timestamps: true })

export const DeviceProfileModel = model('DeviceProfile', DeviceProfileSchema)
