export const GAME_REQUIREMENTS: Record<string, {
    name: string
    minRam: number
    recRam: number
    storage: number
    minAndroid: number
    recAndroid?: number
    minCpu?: string
    fps60Ram: number
    fps90Ram: number
}> = {
    bgmi: {
        name: 'BGMI (Battlegrounds Mobile India)',
        minRam: 2,
        recRam: 4,
        storage: 3,
        minAndroid: 5.1,
        recAndroid: 8,
        minCpu: 'Quad-core 1.5GHz',
        fps60Ram: 4,
        fps90Ram: 6,
    },
    genshin: {
        name: 'Genshin Impact',
        minRam: 4,
        recRam: 8,
        storage: 20,
        minAndroid: 7,
        fps60Ram: 6,
        fps90Ram: 8,
    },
    freefire: {
        name: 'Free Fire',
        minRam: 1,
        recRam: 2,
        storage: 2,
        minAndroid: 4.4,
        fps60Ram: 2,
        fps90Ram: 4,
    },
    callofduty: {
        name: 'Call of Duty Mobile',
        minRam: 2,
        recRam: 4,
        storage: 4,
        minAndroid: 5.1,
        fps60Ram: 3,
        fps90Ram: 6,
    },
    pubg: {
        name: 'PUBG Mobile',
        minRam: 2,
        recRam: 3,
        storage: 3,
        minAndroid: 5.1,
        fps60Ram: 4,
        fps90Ram: 6,
    },
}
