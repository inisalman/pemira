process.env.DATABASE_URL = process.env.DBURL
const { myParticipations } = await import('./server/services/voting/ballots')
console.log(JSON.stringify(await myParticipations('v-17', process.env.EID)))
process.exit(0)
