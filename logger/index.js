const path = require('path')
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, splat, printf } = format
const DailyRotateFile = require('winston-daily-rotate-file')

const { Environment, ClsNamespace } = require('../enums/enums')

const clsNamespace = require('cls-hooked').getNamespace(ClsNamespace)

const mainLogger = create(
    combine(
        timestamp(),
        splat(),
        printf(info => `${info.timestamp} ${info.level}: [${info.callingModule}] ${info.message}`)
    )
)

const clsLogger = create(
    combine(
        timestamp(),
        splat(),
        printf(info => `${info.timestamp} ${info.level} [${info.traceID}]: [${info.callingModule}] ${info.message}`)
    ) 
)

function create(format) {
    let env = process.env.NODE_ENV || Environment.LOCAL
    switch (env) {
        case Environment.LOCAL:
        case Environment.TESTNET:
            return createLogger({
                level: 'debug',
                format: format,
                transports: [
                    new transports.Console()
                ]
            })
        case Environment.MAINNET:
            return createLogger({
                level: 'debug',
                format: format,
                transports: [
                    new transports.Console(),
                    new DailyRotateFile({
                        filename: 'ae-middleware-%DATE%.log',
                        dirname: '/var/log',
                        datePattern: 'YYYY-MM-DD',
                        zippedArchive: true,
                        maxSize: '20m',
                        maxFiles: '7d'
                    })
                ]
            })
    }
}

function getFilenameLabel(callingModule) {
    var parts = callingModule.filename.split(path.sep)
    let result = path.join(parts[parts.length - 2], parts.pop())
    return result
}

function getTraceID() {
    return clsNamespace.get('traceID')
}

module.exports = function(mod) {
    if (!mod) {
        throw new Error('Must provide calling module param when requiring logger!')
    }
    return new Proxy(mainLogger, {
        get(target, property, receiver) {
            let callingModule = getFilenameLabel(mod)
            let traceID = getTraceID()
            let targetValue = traceID ? 
                Reflect.get(clsLogger.child({ traceID, callingModule }), property, receiver) : 
                Reflect.get(mainLogger.child({ callingModule }), property, receiver)
            if (typeof targetValue === 'function') {
                return function (...args) {
                    return targetValue.apply(this, args)
                }
            }
        }
    })
}