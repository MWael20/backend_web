// Get order ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');

// Redirect to home if no order ID
if (!orderId) {
    window.location.href = 'index.html';
}

// Order status mapping
const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered'
};

// Status progress mapping (percentage for progress bar)
const STATUS_PROGRESS = {
    [ORDER_STATUS.PENDING]: 25,
    [ORDER_STATUS.PROCESSING]: 50,
    [ORDER_STATUS.SHIPPED]: 75,
    [ORDER_STATUS.DELIVERED]: 100
};

// Load order details
async function loadOrderDetails() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please log in to view order details', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        const response = await fetch(`http://localhost:3000/api/v1/order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showNotification('Session expired. Please log in again.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            if (response.status === 404) {
                showNotification('Order not found', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            throw new Error('Failed to fetch order details');
        }

        const order = await response.json();
        displayOrderDetails(order);
    } catch (error) {
        console.error('Error loading order:', error);
        showNotification('Failed to load order details', 'error');
    }
}

// Display order details
function displayOrderDetails(order) {
    // Safely update element text content
    function safeUpdateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    // Update order header
    safeUpdateText('orderId', order._id);
    safeUpdateText('orderDate', new Date(order.createdAt).toLocaleDateString());
    
    // Update order status
    const statusElement = document.getElementById('orderStatus');
    if (statusElement) {
        statusElement.textContent = order.status.toUpperCase();
        statusElement.className = `order-status status-${order.status.toLowerCase()}`;
    }

    // Update shipping details
    if (order.shippingAddress) {
        safeUpdateText('shippingName', order.shippingAddress.name);
        safeUpdateText('shippingAddress', 
            `${order.shippingAddress.street}, ${order.shippingAddress.city}`);
        safeUpdateText('shippingPhone', order.shippingAddress.phone);
    }

    // Update payment details
    safeUpdateText('paymentMethod', order.paymentMethod);
    safeUpdateText('paymentStatus', order.paymentStatus);

    // Update tracking progress
    updateTrackingProgress(order.status);

    // Update order items
    const orderItemsContainer = document.getElementById('orderItems');
    if (orderItemsContainer && order.items && order.items.length > 0) {
        orderItemsContainer.innerHTML = order.items.map(item => `
            <div class="order-item">
                <img src="${item.image || 'placeholder.jpg'}" alt="${item.name}" class="item-image">
                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    <p class="item-price">${item.price.toFixed(2)} EGP × ${item.quantity}</p>
                </div>
            </div>
        `).join('');
    }

    // Update order summary
    if (order.items) {
        const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        safeUpdateText('subtotal', `${subtotal.toFixed(2)} EGP`);
        safeUpdateText('shipping', `${(order.shippingCost || 0).toFixed(2)} EGP`);
        safeUpdateText('total', `${(subtotal + (order.shippingCost || 0)).toFixed(2)} EGP`);
    }
}

// Update tracking progress
function updateTrackingProgress(status) {
    const progressElement = document.getElementById('trackingProgress');
    if (progressElement) {
        const progress = STATUS_PROGRESS[status] || 0;
        progressElement.style.width = `${progress}%`;
    }

    // Update step icons
    const steps = ['Ordered', 'Processing', 'Shipped', 'Delivered'];
    const currentStepIndex = steps.findIndex(step => step.toLowerCase() === status.toLowerCase());

    steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step${step}`);
        if (stepElement) {
            if (index <= currentStepIndex) {
                stepElement.classList.add('completed');
            } else {
                stepElement.classList.remove('completed');
            }
        }
    });
}

// Show notification
function showNotification(message, type = 'success', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.minWidth = '200px';
    notification.style.maxWidth = '300px';
    notification.style.fontSize = '14px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Load order details when page loads
document.addEventListener('DOMContentLoaded', loadOrderDetails); 