
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient({
  log: ["query"],
  errorFormat: "pretty",
});
module.exports = prisma;

