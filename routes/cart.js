const express = require('express');
const router = express.Router();
const { Cart } = require('../Data/cart');
const { Product } = require('../Data/product');


// Get user's cart
router.get('/', async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'name price image');

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
            await cart.save();
        }

        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch cart' });
    }
});

// Add item to cart
router.post('/', async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Check stock availability
        if (product.countInStock < quantity) {
            return res.status(400).json({ success: false, error: 'Not enough stock available' });
        }

        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            // Create new cart if doesn't exist
            cart = new Cart({
                user: req.user.id,
                items: [{ product: productId, quantity }]
            });
        } else {
            // Update existing cart
            const existingItem = cart.items.find(item => 
                item.product.toString() === productId
            );

            if (existingItem) {
                // Update quantity if item exists
                existingItem.quantity = Math.min(existingItem.quantity + quantity, 10);
            } else {
                // Add new item
                cart.items.push({ product: productId, quantity });
            }
        }

        await cart.save();
        await cart.populate('items.product', 'name price image');

        res.status(201).json(cart);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, error: 'Failed to add item to cart' });
    }
});

// Update item quantity
router.put('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        // Validate quantity
        if (quantity < 1 || quantity > 10) {
            return res.status(400).json({ success: false, error: 'Invalid quantity' });
        }

        // Check product exists and has enough stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (product.countInStock < quantity) {
            return res.status(400).json({ success: false, error: 'Not enough stock available' });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }

        const cartItem = cart.items.find(item => item.product.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({ success: false, error: 'Item not found in cart' });
        }

        cartItem.quantity = quantity;
        await cart.save();
        await cart.populate('items.product', 'name price image');

        res.json(cart);
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, error: 'Failed to update cart' });
    }
});

// Remove item from cart
router.delete('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();
        await cart.populate('items.product', 'name price image');

        res.json(cart);
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ success: false, error: 'Failed to remove item from cart' });
    }
});

// Clear cart
router.delete('/', async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        res.json({ success: true, message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, error: 'Failed to clear cart' });
    }
});

module.exports = router; 