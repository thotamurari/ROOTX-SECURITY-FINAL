import { MongoClient, ServerApiVersion } from 'mongodb'

const url = 'mongodb://thotamurari2_db_user:0hieMSte7BzE5F8H@ac-dveqtzj-shard-00-00.emmu0qw.mongodb.net:27017,ac-dveqtzj-shard-00-01.emmu0qw.mongodb.net:27017,ac-dveqtzj-shard-00-02.emmu0qw.mongodb.net:27017/safeopen?ssl=true&authSource=admin&retryWrites=true&w=majority'

async function run() {
    console.log('Connecting to MongoDB via bypassed URL...')
    const client = new MongoClient(url, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000
    })

    try {
        await client.connect()
        console.log('✅ TCP Connection successful!')

        await client.db('admin').command({ ping: 1 })
        console.log('✅ Ping successful. Authentication passed.')
    } catch (error) {
        console.error('❌ MongoDB Error:')
        console.error(error.message || error)
    } finally {
        await client.close()
    }
}

run()
