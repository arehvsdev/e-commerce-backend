const Product = require('../models/product');
const createProduct = async( req, res) => {
    try {
        console.log("Create product called");
        const {
            name,
            description,
            category,
            price,
            stock,
            image,
            rating,
        } = req.body;
        
        const product = new Product({
            name,
            description,
            category,
            price,
            stock,
            image,
            rating,
            createdBy: req.user.id
        });
        await product.save();
        res.status(201).json({message: "Product created successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getAllProducts = async(req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort } = req.query;
        const filter = {};

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        if (category) {
            filter.category = category;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};

            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        let query = Product.find(filter);

        if (sort === 'price') {
            query = query.sort({ price: 1 });
        } else if (sort === '-price') {
            query = query.sort({ price: -1 });
        }

        const products = await query;
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getProductById = async(req, res) => {
    try {
        const productId = req.params.id;
        console.log("Get product by ID called with ID:", productId);
        if(!productId.match(/^[0-9a-fA-F]{24}$/)){
            return res.status(400).json({error: "Invalid product ID"});
        }
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({error: "Product not found"});
        }
        res.status(200).json(product);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const updateProduct = async(req, res) => {
    try {
        const productId = req.params.id;
        const {
            name,
            description,
            category,
            price,
            stock,
            image,
            rating,
        } = req.body;
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({error: "Product not found"});
        }
        Object.assign(product, req.body);
        await product.save();
        res.status(200).json({message: "Product updated successfully"});
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }

}
const deleteProduct = async(req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({error: "Product not found"});
        }
        await product.remove();
        res.status(200).json({message: "Product deleted successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const patchProduct = async(req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({error: "Product not found"});
        }

        const allowedFields = ["name", "description", "category", "price", "stock", "image", "rating"];
        const updates = Object.keys(req.body).filter((field) => allowedFields.includes(field));

        if (updates.length === 0) {
            return res.status(400).json({ error: "No valid fields provided for update." });
        }

        updates.forEach((field) => {
            product[field] = req.body[field];
        });

        await product.save();
        res.status(200).json({message: "Product patched successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    patchProduct,
    getAllProducts,
    getProductById
}