
const generateSuccessResponse = function (data) {
    let response = {
        id: data.id,
        ver: data.version || 1.0,
        ts: new Date(),
        params: {
            status: data.status || 'success',
            errMessage: data.errMessage || ''
        },
        responseCode: data.responseCode || 'OK',
        result: data.result || {}
    }

    return response;
}

const generateErrorResponse = function (data) {
    let response = {
        id: data.id,
        ver: data.version || 1.0,
        ts: new Date(),
        params: {
            status: data.status || 'failed',
            errMessage: data.errMessage
        },
        responseCode: data.responseCode,
        error: data.error || {}
    }

    return response;
}

module.exports = { generateSuccessResponse, generateErrorResponse };