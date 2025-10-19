const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient({
  log: [
    {
      emit: 'stdout',
      level: 'error' // Log only errors to stdout
    },
    {
      emit: 'stdout',
      level: 'query' // Log database queries
    }
    // You can also add other levels like 'warn', 'info', or 'query'
    // {
    //   emit: 'stdout',
    //   level: 'warn',
    // },
    // {
    //   emit: 'stdout',
    //   level: 'info',
    // },
  ],
  errorFormat: 'pretty'
})
module.exports = prisma
