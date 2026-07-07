const productValidator = (req, res, next) => {
    const { name, description, category, price, stock, image, rating } = req.body;
    const isPatchRequest = req.method === "PATCH";

    if (isPatchRequest) {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "No fields provided for update." });
        }

        if (price !== undefined && (typeof price !== "number" || !Number.isFinite(price) || price <= 0)) {
            return res.status(400).json({ error: "Invalid price." });
        }

        if (stock !== undefined && (typeof stock !== "number" || !Number.isFinite(stock) || stock < 0)) {
            return res.status(400).json({ error: "Invalid stock." });
        }

        if (rating !== undefined && (typeof rating !== "number" || !Number.isFinite(rating) || rating < 0 || rating > 5)) {
            return res.status(400).json({ error: "Invalid rating. Rating should be between 0 and 5." });
        }

        if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
            return res.status(400).json({ error: "Invalid name." });
        }

        if (description !== undefined && (typeof description !== "string" || description.trim() === "")) {
            return res.status(400).json({ error: "Invalid description." });
        }

        if (category !== undefined && (typeof category !== "string" || category.trim() === "")) {
            return res.status(400).json({ error: "Invalid category." });
        }

        if (image !== undefined && (typeof image !== "string" || image.trim() === "")) {
            return res.status(400).json({ error: "Invalid image." });
        }

        return next();
    }

    if (
        name === undefined ||
        description === undefined ||
        category === undefined ||
        price === undefined ||
        stock === undefined ||
        image === undefined ||
        rating === undefined
    ) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ error: "Invalid price." });
    }

    if (typeof stock !== "number" || !Number.isFinite(stock) || stock < 0) {
        return res.status(400).json({ error: "Invalid stock." });
    }

    if (typeof rating !== "number" || !Number.isFinite(rating) || rating < 0 || rating > 5) {
        return res.status(400).json({ error: "Invalid rating. Rating should be between 0 and 5." });
    }

    next();
};

module.exports = productValidator;