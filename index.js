const express = require('express')
const crypto = require('crypto')
/*
var morgan = require("morgan");
const pino = require("pino-http")();
*/

const cors = require("cors");

const cloudinary = require("cloudinary").v2;

// setup prisma-session-store to hold the session data
const session = require('express-session')
const { PrismaSessionStore } = require('@quixo3/prisma-session-store')
const { PrismaClient } = require('./generated/prisma')

const passport = require('./middleware/passport')

const path = require('node:path')
require('dotenv').config();

const app = express()

// add some loggers
/*
app.use(morgan("combined"));
app.use(pino);
*/

// setup ejs for templating views
// eslint-disable-next-line no-undef
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// allow public assets to be seen
// eslint-disable-next-line no-undef
const assetsPath = path.join(__dirname, 'public')
app.use(express.static(assetsPath))
app.use(express.urlencoded({ extended: true })) // used to parse form body
// Return "https" URLs by setting secure: true


async function setupCloudinary() {
  console.log("Setting up Cloudinary")
  
  await cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Log the configuration
  console.log(cloudinary.config());
}

setupCloudinary();



app.use(cors()); 

const MS_IN_24_HRS = 1000 * 60 * 60 * 24 // 24 hours in milliseconds

// eslint-disable-next-line no-undef
if (!process.env.SESSION_SECRET) {
  console.log('found no session secret in .env, so must create one')
  const b = crypto.randomBytes(40) // any number over 32 is fine
  console.log(`Setup the SECRET_SESSION value in .env with: ${b.toString('hex')}`)
  throw new Error('Failed to find a session secret in .env')
}

app.use(
  session({
    cookie: {
      maxAge: MS_IN_24_HRS
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: MS_IN_24_HRS + 60,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined
    })
  })
)

app.use(passport.session())

app.use((req, res, next) => {
  res.locals.currentUser = req.user
  next()
})


const userRouter = require('./routers/userRouter')
app.use('/', userRouter)

const fileRouter = require('./routers/fileRouter')
app.use('/file', fileRouter)

// Catch-all for unhandled routes (must be placed last but before error handler)
app.use((req, res) => {
  res.status(404).send({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  })
})

// catch-all for errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.status === 401) {
    console.log('user tried to do something without being authenticated, tell them!')
  }
  console.error('in the catch-all: ', err)
  if (res.statusCode < 400) {
    res.status(500)
  }
  // Send a user-friendly error message to the client
  res.render('500', { statuscode: req.statusCode , errors: err })

})

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`listening on port ${port}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`)
  } else {
    console.error('Server startup error:', err)
  }
  process.exit(1) // Exit the process if a critical error occurs
})
