const prisma = require("../middleware/prisma");

// run inside `async` function
async function addNewUser(name, email, password) {
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password
    },
  });
  return newUser;
} 

async function findUser(email) {
  console.log("in findUser: ", email);
  const user = await prisma.user.findFirst({
    where: {
      email
    }
  });
  console.log("rows found: ", user);
  return user;
}

async function findUserById(id) {
  console.log("in findUserById: ", id)
  // By unique identifier
  const user = await prisma.user.findFirst({
    where: {
      id,
    },
  })
  console.log("return user: ", user)
  return user;
}

module.exports = {
  addNewUser,
  findUser,
  findUserById,
};