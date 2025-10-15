const prisma = require("../middleware/prisma");

// run inside `async` function
async function addNewUser(name, email, password) {
  await prisma.user.create({
    data: {
      name,
      email,
      password
    },
  })
} 


module.exports = {
  addNewUser,
}