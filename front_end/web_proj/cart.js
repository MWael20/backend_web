// Cart state
let cartItems = [];
let shippingCost = 50; // Fixed shipping cost in EGP

// Load cart on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the cart page
    const isCartPage = window.location.pathname.includes('cart.html');
    
    // Always load cart data
    loadCart();
    
    // Only setup cart-specific listeners if we're on the cart page
    if (isCartPage) {
        setupCartPage();
    }
});

// Setup cart page specific elements
function setupCartPage() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }

    // Setup quantity controls and remove buttons
    setupEventListeners();
}

// Handle checkout submission
async function handleCheckout(e) {
    e.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please log in to place an order', 'error', 4000);
            window.location.href = 'login.html';
            return;
        }

        if (cartItems.length === 0) {
            showNotification('Your cart is empty', 'error', 4000);
            return;
        }

        // Get form data
        const formData = new FormData(e.target);
        
        // Validate required fields
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'city'];
        const missingFields = requiredFields.filter(field => !formData.get(field));
        
        if (missingFields.length > 0) {
            showNotification('Please fill in all required fields', 'error', 4000);
            return;
        }

        // Create shipping address object
        const shippingAddress = {
            name: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            street: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode'),
            country: formData.get('country')
        };

        // Create payment info object
        const paymentInfo = {
            cardName: formData.get('cardName'),
            cardNumber: formData.get('cardNumber'),
            expiryDate: formData.get('expiryDate'),
            cvv: formData.get('cvv')
        };

        // Create order payload
        const orderData = {
            items: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            })),
            shippingAddress,
            paymentInfo,
            shippingCost: shippingCost,
            total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + shippingCost
        };

        // Send order to server
        const response = await fetch('http://localhost:3000/api/v1/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create order');
        }

        const order = await response.json();

        // Clear cart after successful order
        cartItems = [];
        localStorage.removeItem('cart');
        updateCartDisplay();
        updateCartBadge();

        // Show success message and redirect to order page
        showNotification('Order placed successfully!', 'success', 4000);
        setTimeout(() => {
            window.location.href = `order.html?orderId=${order._id}`;
        }, 2000);

    } catch (error) {
        console.error('Error placing order:', error);
        showNotification(error.message || 'Failed to place order. Please try again.', 'error', 4000);
    }
}

// Setup event listeners
function setupEventListeners() {
    const cartItemsList = document.getElementById('cartItemsList');
    if (cartItemsList) {
        cartItemsList.addEventListener('click', (e) => {
            const target = e.target;
            
            // Handle quantity buttons
            if (target.classList.contains('quantity-btn')) {
                e.preventDefault();
                const item = target.closest('.cart-item');
                if (!item) return;
                
                const productId = item.dataset.id;
                const currentQuantity = parseInt(item.querySelector('.quantity').textContent);
                
                if (target.classList.contains('minus')) {
                    updateQuantity(productId, currentQuantity - 1);
                } else if (target.classList.contains('plus')) {
                    updateQuantity(productId, currentQuantity + 1);
                }
            }
            
            // Handle remove button
            if (target.classList.contains('fa-trash') || target.classList.contains('remove-btn')) {
                e.preventDefault();
                const item = target.closest('.cart-item');
                if (!item) return;
                
                const productId = item.dataset.id;
                removeFromCart(productId);
            }
        });
    }
}

// Validate token
function isValidToken() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        // Check if token is expired by checking its JWT expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < expirationTime;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
}

// Refresh token if needed
async function refreshTokenIfNeeded() {
    try {
        const response = await fetch('http://localhost:3000/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

// Load cart items from server or localStorage
async function loadCart() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            // Load from server if user is logged in
            const response = await fetch('http://localhost:3000/api/v1/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                cartItems = data.items || [];
            } else {
                // If server request fails, fall back to localStorage
                cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
            }
        } else {
            // Load from localStorage if user is not logged in
            cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        }
        
        updateCartDisplay();
        updateCartBadge();
    } catch (error) {
        console.error('Error loading cart:', error);
        // Fall back to localStorage on error
        cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        updateCartDisplay();
        updateCartBadge();
    }
}

// Update cart display
function updateCartDisplay() {
    const cartItemsList = document.getElementById('cartItemsList');
    const subtotalElement = document.getElementById('subtotalAmount');
    const shippingElement = document.getElementById('shippingAmount');
    const totalElement = document.getElementById('totalAmount');

    // Check if we're on the cart page
    if (!cartItemsList) {
        // We might be on a different page, just update the badge
        updateCartBadge();
        return;
    }
    
    if (cartItems.length === 0) {
        cartItemsList.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="products.html" class="continue-shopping">Continue Shopping</a>
            </div>
        `;
    } else {
        cartItemsList.innerHTML = cartItems.map(item => `
            <div class="cart-item" data-id="${item.productId}">
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <div class="item-details">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-price">${item.price.toFixed(2)} EGP</p>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                    <button class="remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update totals if elements exist
    if (subtotalElement && shippingElement && totalElement) {
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + shippingCost;

        subtotalElement.textContent = `${subtotal.toFixed(2)} EGP`;
        shippingElement.textContent = `${shippingCost.toFixed(2)} EGP`;
        totalElement.textContent = `${total.toFixed(2)} EGP`;
    }
}

// Update cart badge
function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) {
        const cartIcon = document.querySelector('.fa-shopping-cart');
        if (cartIcon && cartIcon.parentElement) {
            const newBadge = document.createElement('span');
            newBadge.className = 'cart-badge';
            cartIcon.parentElement.appendChild(newBadge);
            updateCartBadge(); // Call again now that badge exists
            return;
        }
        return; // Exit if we can't find the cart icon
    }

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'block' : 'none';
}

// Update item quantity
async function updateQuantity(productId, newQuantity) {
    newQuantity = parseInt(newQuantity);
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 10) newQuantity = 10;

    try {
        // Update local state first for immediate feedback
        cartItems = cartItems.map(item => 
            item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
        localStorage.setItem('cart', JSON.stringify(cartItems));
        updateCartDisplay();
        updateCartBadge();

        const token = localStorage.getItem('token');
        if (token) {
            // Try to update on server if logged in
            const response = await fetch(`http://localhost:3000/api/v1/cart/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    quantity: newQuantity,
                    productId: productId 
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showNotification('Cart updated locally. Please refresh the page if issues persist.', 'warning', 4000);
                } else {
                    showNotification('Cart updated locally only', 'warning', 4000);
                }
                return;
            }

            showNotification('Cart updated successfully', 'success', 4000);
        } else {
            showNotification('Cart updated locally', 'success', 4000);
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('Cart updated locally only', 'warning', 4000);
    }
}

// Remove item from cart
async function removeFromCart(productId) {
    try {
        // Remove from local state first for immediate feedback
        cartItems = cartItems.filter(item => item.productId !== productId);
        localStorage.setItem('cart', JSON.stringify(cartItems));
        updateCartDisplay();
        updateCartBadge();

        const token = localStorage.getItem('token');
        if (token) {
            // Try to remove from server if logged in
            const response = await fetch(`http://localhost:3000/api/v1/cart/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showNotification('Item removed locally. Please refresh the page if issues persist.', 'warning', 4000);
                } else {
                    showNotification('Item removed locally only', 'warning', 4000);
                }
                return;
            }

            showNotification('Item removed successfully', 'success', 4000);
        } else {
            showNotification('Item removed from cart', 'success', 4000);
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showNotification('Item removed locally only', 'warning', 4000);
    }
}

// Show notification
function showNotification(message, type = 'success', duration = 8000) {
    // Remove existing notifications of the same type
    const existingNotifications = document.querySelectorAll(`.notification.${type}`);
    existingNotifications.forEach(notification => {
        if (notification.parentElement) {
            notification.remove();
        }
    });

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.transform = 'none';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                      type === 'warning' ? '#ff9800' : '#f44336';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.minWidth = '200px';
    notification.style.maxWidth = '300px';
    notification.style.fontSize = '14px';
    notification.style.textAlign = 'left';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Fade out
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 500);
    }, duration);
}