import postgres from 'postgres'

const globalForDb = globalThis as unknown as { db: ReturnType<typeof postgres> }

export const db =
  globalForDb.db ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false, // required for transaction pooler
  })

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
