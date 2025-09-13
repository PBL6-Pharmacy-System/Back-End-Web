import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)

export default sql

// Test thử kết nối
sql`SELECT NOW()`.then(res => {
  console.log('✅ Kết nối DB thành công:', res[0].now)
}).catch(err => {
  console.error('❌ Kết nối DB thất bại:', err)
})
