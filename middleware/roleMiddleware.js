const { sendError } = require("../utils/apiResponse");

const roleMiddleware = (...roles) => {
    const allowedRoles = roles.map((role) => role.toLowerCase());

    return (req, res, next) => {
        const userRole = req.user && req.user.role && req.user.role.toLowerCase();

        if (!userRole || !allowedRoles.includes(userRole)) {
            return sendError(res, 403, "Access denied. You do not have permission to perform this action.");
        }

        next();
    }
}

module.exports = roleMiddleware;
