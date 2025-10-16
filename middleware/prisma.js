
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient({
  log: [
    {
      emit: "stdout",
      level: "error", // Log only errors to stdout
    },
    // You can also add other levels like 'warn', 'info', or 'query'
    // {
    //   emit: 'stdout',
    //   level: 'warn',
    // },
    // {
    //   emit: 'stdout',
    //   level: 'info',
    // },
    // {
    //   emit: 'stdout',
    //   level: 'query', // Log database queries
    // },
  ],
  errorFormat: "pretty",
});
module.exports = prisma;

