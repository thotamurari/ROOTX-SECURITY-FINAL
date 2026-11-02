import express, { type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { supabase } from '../utils/supabase.js'

const router = express.Router()

// Sync device data from Android app
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId
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
    const { error } = await supabase
      .from('behavior_profiles')
      .upsert({
        user_id: userId,
        baseline: deviceData,
        today: deviceData,
        last_updated: new Date().toISOString()
      })

    if (error) {
      console.warn('Device profile sync to Supabase skipped:', error.message)
    }

    res.json({ success: true, model: deviceData.model, synced: new Date() })
  } catch (err: any) {
    console.warn('Device sync error (falling back):', err.message)
    res.json({ success: true, model: deviceData.model, synced: new Date() })
  }
})

// Get device profile for current user
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) {
     res.status(401).json({ error: 'Unauthorized' })
     return
  }

  const defaultProfile = {
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
    installedAppsCount: 0,
    riskyAppsCount: 0,
    dangerousPermsCount: 0,
    bgProcessCount: 0,
    topBatteryDrains: 'No data — open AndroidSEC to scan',
    lastSynced: null,
    isNewDevice: true
  }

  try {
    const { data: profile, error } = await supabase
      .from('behavior_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !profile) {
      res.json(defaultProfile)
      return
    }

    res.json(profile.today || profile.baseline || defaultProfile)
  } catch (err: any) {
    console.warn('Device profile fetch skipped (returning default):', err.message)
    res.json(defaultProfile)
  }
})

export default router
