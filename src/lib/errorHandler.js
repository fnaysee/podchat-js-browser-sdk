const errorList = [
    {
        code: 12400,
        message: "Could not grant video input permission"
    },
    {
        code: 12401,
        message: "Could not grant audio input permission"
    },
    {
        code: 12402,
        message: "Could not grant audio out permission"
    },
    {
        code: 12403,
        message: "Current environment does not supports user media devices"
    },

];


const handleError = function (error) {
    let item = errorList.filter(item => item.code == error);
    if(!item.length)
        return {};

    return item[0];
}

export default handleError
export { errorList }
