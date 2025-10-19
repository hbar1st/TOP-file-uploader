class ValidationError extends Error {
  constructor (message) {
    super(message)
    this.statusCode = 409
    // So the error is neat when stringified. NotFoundError: message instead of Error: message
    this.name = 'ValidationError'
  }
}

module.exports = ValidationError
