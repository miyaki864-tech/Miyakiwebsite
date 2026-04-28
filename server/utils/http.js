function sendDbError(res, err) {
    return res.status(400).json({ error: err.message });
}

function asyncRoute(handler) {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            return sendDbError(res, error);
        }
    };
}

function withImageUpload(upload, handler) {
    return (req, res, next) => {
        upload(req, res, async (error) => {
            if (error) return sendDbError(res, error);

            try {
                await handler(req, res, next);
            } catch (err) {
                return sendDbError(res, err);
            }
        });
    };
}

module.exports = {
    asyncRoute,
    sendDbError,
    withImageUpload,
};
