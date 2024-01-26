class CustomException extends Error {
  constructor (message, errorCode) {
    super(message)
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name
    this.status = errorCode
  }
}

module.exports = CustomException