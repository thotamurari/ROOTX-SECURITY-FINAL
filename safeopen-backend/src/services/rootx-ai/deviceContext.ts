import { GAME_REQUIREMENTS } from './gameDatabase'

export function buildDeviceContext(): string {
    const gamesList = Object.entries(GAME_REQUIREMENTS)
        .map(([, g]) => `${g.name}: min ${g.minRam}GB RAM, ${g.storage}GB storage, Android ${g.minAndroid}+`)
        .join('\n')

    return `
Device: Samsung Galaxy A52
Android: 13.0
RAM: 6GB total, 1.2GB free (20% available)
CPU: Octa-core 2.3GHz (Snapdragon 720G)
Storage: 128GB total, 30GB free (76% used)
Battery: 84% health, 32°C temperature, 4500mAh

Top battery drain apps: Instagram (22%), WhatsApp (18%), TikTok (14%)
Background processes: 12 apps running
Risky apps detected: Facebook, TikTok, Clean Master, Flashlight Pro (4 total)
Dangerous permissions: 23 across all apps
Apps requesting location: 8 apps
Apps with internet access: 47 apps

Storage breakdown:
- Photos/Videos: 49.8GB
- Apps: 28.1GB
- Cache: 8.4GB (cleanable)
- Documents: 3.2GB
- System: 6.5GB
- Other: 0.5GB

Known game requirements:
${gamesList}
`.trim()
}
