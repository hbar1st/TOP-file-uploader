const prisma = require("../middleware/prisma");

// run inside `async` function
async function addNewUser(name, email) {
  await prisma.user.create({
    data: {
      name,
      email,
    },
  })
} 


module.exports = {
  addNewUser,
}