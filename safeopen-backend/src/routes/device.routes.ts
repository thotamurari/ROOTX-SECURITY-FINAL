import express, { type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { DeviceProfileModel } from '../models/device.model.js'
import { ApkScanModel } from '../models/apkScanSession.model.js'

const router = express.Router()

// Sync device data from Android app
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId ?? (req as any).user?.id
  if (!userId) {
     res.status(401).json({ error: 'Unauthorized' })
     return
  }

  const { deviceData } = req.body
  if (!deviceData) {
     res.status(400).json({ error: 'No device data' })
     return
  }

  try {
    const updated = await DeviceProfileModel.findOneAndUpdate(
      { userId },
      {
        userId,
        ...deviceData,
        lastSynced: new Date(),
        $inc: { syncCount: 1 }
      },
      { upsert: true, new: true, runValidators: true }
    )
    res.json({ success: true, model: updated.model, synced: updated.lastSynced })
  } catch (err: any) {
    console.error('Device sync error:', err.message)
    res.status(500).json({ error: 'Sync failed' })
  }
})

// Get device profile for current user
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId ?? (req as any).user?.id
  if (!userId) {
     res.status(401).json({ error: 'Unauthorized' })
     return
  }

  try {
    let profile = await DeviceProfileModel.findOne({ userId }).lean()

    if (!profile) {
      // Try to get data from APK scan
      const apkScan = await ApkScanModel
        .findOne({ userId })
        .sort({ scannedAt: -1 })
        .lean()

      // Return defaults with apk data if available
      res.json({
        model: 'Your Device',
        androidVersion: 'Unknown',
        ramTotalGB: 4,
        ramFreeGB: 1,
        storageTotalGB: 64,
        storageFreeGB: 10,
        storageUsedPercent: 84,
        batteryPercent: 80,
        batteryHealth: 85,
        batteryTemp: 30,
        isCharging: false,
        installedAppsCount: apkScan?.results?.length || 0,
        riskyAppsCount: apkScan?.summary?.risky || 0,
        dangerousPermsCount: 0,
        bgProcessCount: 0,
        topBatteryDrains: 'No data — open AndroidSEC to scan',
        lastSynced: null,
        isNewDevice: true
      })
      return
    }

    // Enrich with latest APK scan results
    const apkScan = await ApkScanModel
      .findOne({ userId })
      .sort({ scannedAt: -1 })
      .lean()

    if (apkScan?.summary) {
      profile.riskyAppsCount = apkScan.summary.risky || 0
    }

    res.json(profile)
  } catch (err: any) {
    console.error('Device profile error:', err.message)
    res.status(500).json({ error: 'Failed to load profile' })
  }
})

export default router
