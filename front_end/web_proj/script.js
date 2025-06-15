// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar scroll effect with parallax
const navbar = document.querySelector('.navbar');
let lastScroll = 0;
let scrollTimeout;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Clear the timeout if it exists
    clearTimeout(scrollTimeout);
    
    // Add scroll class to body
    document.body.classList.add('is-scrolling');
    
    // Set a timeout to remove the class
    scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
    }, 100);
    
    if (currentScroll <= 0) {
        navbar.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
        // Scroll Down
        navbar.classList.remove('scroll-up');
        navbar.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
        // Scroll Up
        navbar.classList.remove('scroll-down');
        navbar.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Parallax effect for hero section
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
});

// Intersection Observer for fade-in animations with stagger effect
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Add delay based on index for stagger effect
            setTimeout(() => {
                entry.target.classList.add('fade-in');
            }, index * 100);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all product cards and category cards
document.querySelectorAll('.product-card, .category-card').forEach(card => {
    observer.observe(card);
});

// Mouse move parallax effect for product cards
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
});

// Add to cart functionality with enhanced animation
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', async function(event) {
        event.preventDefault();
        const product = this.closest('.product-card');
        
        const productId = product.querySelector('img').getAttribute('onclick').match(/id=([^'&]+)/)[1];
        const productName = product.querySelector('h3').textContent;
        const productPrice = parseFloat(product.querySelector('.price').textContent.match(/\d+(\.\d+)?/)[0]);
        const productImage = product.querySelector('img').src;
        
        const newItem = {
            productId,
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1
        };

        const token = localStorage.getItem('token');

        try {
            if (token) {
                // ✅ Logged in → send to server
                const response = await fetch('http://localhost:3000/api/v1/cart', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ productId, quantity: 1 })
                        });

                if (!response.ok) throw new Error('Failed to add item to cart');

                // You may optionally fetch updated cart here
            } else {
                // ❌ Not logged in → use localStorage
                let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
                const index = cartItems.findIndex(item => item.productId === productId);

                if (index !== -1) {
                    cartItems[index].quantity = Math.min(cartItems[index].quantity + 1, 10);
                } else {
                    cartItems.push(newItem);
                }

                localStorage.setItem('cart', JSON.stringify(cartItems));
            }

            // ✅ Update cart badge
            updateCartBadge();

            // 💫 Ripple animation
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            this.appendChild(ripple);

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;

            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            setTimeout(() => ripple.remove(), 600);
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 200);

            showNotification(`${productName} added to cart!`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Failed to add item to cart', 'error');
        }
    });
});

// Enhanced notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS for enhanced notifications and animations
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        padding: 1rem 2rem;
        border-radius: 10px;
        transform: translateY(100px) scale(0.8);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        border: 1px solid rgba(0, 255, 136, 0.2);
    }
    
    .notification.show {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .notification i {
        color: var(--primary-color);
        font-size: 1.5rem;
    }
    
    .clicked {
        transform: scale(0.95);
    }
    
    .ripple {
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .fade-in {
        animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .is-scrolling {
        cursor: grabbing;
    }
    
    .is-scrolling * {
        pointer-events: none;
    }
`;
document.head.appendChild(style);

// Enhanced search functionality
const searchIcon = document.querySelector('.fa-search');
searchIcon.addEventListener('click', () => {
    const searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.innerHTML = `
        <div class="search-container">
            <input type="text" placeholder="Search products..." class="search-input">
            <button class="close-search">&times;</button>
            <div class="search-suggestions"></div>
        </div>
    `;
    
    document.body.appendChild(searchOverlay);
    
    // Focus on input with animation
    setTimeout(() => {
        searchOverlay.querySelector('.search-input').focus();
    }, 100);
    
    // Close search
    searchOverlay.querySelector('.close-search').addEventListener('click', () => {
        searchOverlay.classList.add('closing');
        setTimeout(() => {
            searchOverlay.remove();
        }, 300);
    });
    
    // Close on escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            searchOverlay.classList.add('closing');
            setTimeout(() => {
                searchOverlay.remove();
            }, 300);
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
    
    // Search input animation
    const searchInput = searchOverlay.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.length > 0) {
            searchOverlay.classList.add('has-input');
        } else {
            searchOverlay.classList.remove('has-input');
        }
    });
});

// Add CSS for enhanced search overlay
const searchStyle = document.createElement('style');
searchStyle.textContent = `
    .search-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .search-overlay:not(.closing) {
        opacity: 1;
    }
    
    .search-container {
        width: 90%;
        max-width: 600px;
        position: relative;
        transform: translateY(20px);
        transition: transform 0.3s ease;
    }
    
    .search-overlay:not(.closing) .search-container {
        transform: translateY(0);
    }
    
    .search-input {
        width: 100%;
        padding: 1.5rem;
        font-size: 1.5rem;
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--primary-color);
        color: var(--text-color);
        outline: none;
        transition: all 0.3s ease;
    }
    
    .search-input:focus {
        border-bottom-color: var(--primary-color);
        box-shadow: 0 2px 10px rgba(0, 255, 136, 0.2);
    }
    
    .close-search {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-color);
        font-size: 2rem;
        cursor: pointer;
        padding: 0.5rem;
        transition: all 0.3s ease;
    }
    
    .close-search:hover {
        color: var(--primary-color);
        transform: translateY(-50%) rotate(90deg);
    }
    
    .search-suggestions {
        margin-top: 1rem;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
    }
    
    .search-overlay.has-input .search-suggestions {
        opacity: 1;
        transform: translateY(0);
    }
`;

window.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedProducts();
    fetchCategories();
    fetchBrands();
    fetchAllProducts();
});

function fetchFeaturedProducts() {
    fetch('http://localhost:3000/api/v1/product?populate=brand,category')
        .then(res => res.json())
        .then(products => {
            const featuredContainer = document.getElementById('featured-products-container');
            featuredContainer.innerHTML = '';

            const featuredProducts = products.filter(product => product.isFeatured);

            featuredProducts.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                        <img class="product-image" src="${product.image}" alt="${product.name}" onclick="window.location.href='productDetails.html?id=${product._id}'">
                        <div class="product-info">
                            <h3 onclick="window.location.href='productDetails.html?id=${product._id}'">${product.name}</h3>
                            <p class="brand">${product.brand?.name || "Unknown Brand"}</p>
                            <p class="price">Price: ${product.price} EGP</p>
                        </div>
                        <div class="product-actions">
                            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(event)">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <span class="cart-message" style="display:none;">✔ Added to Cart!</span>
                        </div>
                    `;
                featuredContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error loading featured products:', error);
        });
}

function fetchCategories() {
    fetch('http://localhost:3000/api/v1/category')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('category-grid');
            container.innerHTML = '';

            data.forEach(category => {
                const card = document.createElement('div');
                card.className = 'category-card';

                card.innerHTML = `
                    <img src="${category.image}" alt="${category.name}">
                    <h3>${category.name}</h3>
                `;

                card.addEventListener('click', () => {
                    window.location.href = `searchProduct.html?category=${category._id}`;
                });

                container.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Error fetching categories:', err);
        });
}

function fetchBrands() {
    fetch('http://localhost:3000/api/v1/brand')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('brand-grid');
            container.innerHTML = '';

            data.forEach(brand => {
                const card = document.createElement('div');
                card.className = 'brand-card';
                card.innerHTML = `<h3>${brand.name}</h3>`;
                container.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Error fetching brands:', err);
        });
}

function fetchAllProducts() {
    fetch('http://localhost:3000/api/v1/product?populate=brand,category')
        .then(res => res.json())
        .then(products => {
            const container = document.getElementById('all-products-container');
            const grouped = {};

            products.forEach(product => {
                const category = product.category?.name || 'Others';
                if (!grouped[category]) grouped[category] = [];
                grouped[category].push(product);
            });

            Object.entries(grouped).forEach(([category, items], index) => {
                const section = document.createElement('section');
                section.classList.add('category-section');

                const h2 = document.createElement('h2');
                h2.textContent = category;
                section.appendChild(h2);

                const grid = document.createElement('div');
                grid.className = 'product-grid';

                items.forEach((product, i) => {
                    const card = document.createElement('div');
                    card.className = 'product-card fade-in';
                    card.style.animationDelay = `${(i + 1) * 0.1}s`;

                    card.innerHTML = `
                        <img class="product-image" src="${product.image}" alt="${product.name}" onclick="window.location.href='productDetails.html?id=${product._id}'">
                        <div class="product-info">
                            <h3 onclick="window.location.href='productDetails.html?id=${product._id}'">${product.name}</h3>
                            <p class="brand">${product.brand?.name || "Unknown Brand"}</p>
                            <p class="price">Price: ${product.price} EGP</p>
                        </div>
                        <div class="product-actions">
                            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(event)">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <span class="cart-message" style="display:none;">✔ Added to Cart!</span>
                        </div>
                    `;

                    grid.appendChild(card);
                });

                section.appendChild(grid);
                container.appendChild(section);
            });
        })
        .catch(err => {
            console.error('Failed to load products:', err);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.querySelector(".search-button");
    const searchOverlay = document.querySelector(".search-overlay");

    if (searchButton && searchOverlay) {
        searchButton.addEventListener("click", () => {
            searchOverlay.classList.toggle("active");
        });
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get("q");
    const categoryId = params.get("category");

    const container = document.getElementById("search-results-container");
    container.innerHTML = "<p>Loading products...</p>";

    try {
        let apiUrl = "";

        if (searchTerm) {
            apiUrl = `http://localhost:3000/api/v1/product/search?q=${searchTerm}&populate=brand`;
        } else if (categoryId) {
            apiUrl = `http://localhost:3000/api/v1/product?category=${categoryId}&populate=brand`;
        }

        if (!apiUrl) {
            container.innerHTML = "<p>No search query provided.</p>";
            return;
        }

        const res = await fetch(apiUrl);
        const result = await res.json();

        // ✅ Support both formats: direct array or { success: true, data: [...] }
        const products = Array.isArray(result)
            ? result
            : result.success && Array.isArray(result.data)
            ? result.data
            : [];

        if (products.length === 0) {
            container.innerHTML = "<p>No products found.</p>";
            return;
        }

        displayProducts(products);
    } catch (error) {
        console.error("Failed to fetch products", error);
        container.innerHTML = "<p>Error loading products.</p>";
    }
});

                    
function displayProducts(products) {
    const container = document.getElementById("search-results-container");

    container.innerHTML = products
        .map(product => `
            <div class="product-card" onclick="window.location.href='productDetails.html?id=${product._id}'">
                <img class="product-image "src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.brand?.name || "Unknown Brand"}</p>
                <p>Price: ${product.price} EGP</p>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(event)">Add to Cart</button>
                <span class="cart-message" style="display:none;">✔ Added to Cart!</span>
            </div>
        `)
        .join("");
}

function addToCart(event) {
    const btn = event.target;
    const productCard = btn.closest('.product-card');
    const productId = productCard.querySelector('img').onclick.toString().match(/id=([^'&]+)/)[1];
    const productName = productCard.querySelector('h3').textContent;
    const productPrice = parseFloat(productCard.querySelector('p:last-of-type').textContent.match(/\d+/)[0]);
    const productImage = productCard.querySelector('img').src;

    // Create new item object
    const newItem = {
        productId,
        name: productName,
        price: productPrice,
        image: productImage,
        quantity: 1
    };

    // Get existing cart items or initialize empty array
    let cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
        // Increment quantity if item exists
        cartItems[existingItemIndex].quantity = Math.min(cartItems[existingItemIndex].quantity + 1, 10);
    } else {
        // Add new item if it doesn't exist
        cartItems.push(newItem);
    }

    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));

    // Show success message
    const message = btn.nextElementSibling;
    message.style.display = "inline";
    setTimeout(() => {
        message.style.display = "none";
    }, 2000);
}

document.getElementById("searchButton").addEventListener("click", () => {
    const input = document.getElementById("searchInput").value.trim();
    if (input) {
        window.location.href = `searchProduct.html?q=${encodeURIComponent(input)}`;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const loginLink = document.getElementById("login-link");
    const logoutLink = document.getElementById("logout-link");
    const logoutMessage = document.getElementById("logout-message");
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (loginLink && logoutLink) {
        if (token) {
            loginLink.style.display = "none";
            logoutLink.style.display = "inline";

            //  Only show admin link if logged in AND isAdmin
            if (isAdmin) {
                const adminLink = document.getElementById("admin-link");
                if (adminLink) adminLink.style.display = "inline";
            }

        } else {
            loginLink.style.display = "inline";
            logoutLink.style.display = "none";

            //  Hide admin link if logged out
            const adminLink = document.getElementById("admin-link");
            if (adminLink) adminLink.style.display = "none";
        }

        // Logout handler
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("isAdmin");

            if (logoutMessage) {
                logoutMessage.style.display = "block";
                setTimeout(() => {
                    logoutMessage.style.display = "none";
                    window.location.href = "login.html";
                }, 2500);
            } else {
                window.location.href = "login.html";
            }
        });
    }
});

