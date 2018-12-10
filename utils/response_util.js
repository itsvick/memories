
const generateSuccessResponse = function (data) {
    let response = {
        id: data.id,
        ver: data.version || 1.0,
        ts: new Date(),
        params: {
            status: data.status,
            errConstant: data.errConstant,
            errMessage: data.errMessage
        },
        responseCode: data.responseCode || 'OK',
        result: data.result
    }

    return response;
}

const generateErrorResponse = function (data) {
    let response = {
        id: data.id,
        ver: data.version || 1.0,
        ts: new Date(),
        params: {
            status: data.status,
            errConstant: data.errConstant,
            errMessage: data.errMessage
        },
        responseCode: data.responseCode,
        result: {}
    }

    return response;
}

module.exports = { generateSuccessResponse, generateErrorResponse };