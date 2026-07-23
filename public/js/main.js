// Global state
let exchangeRates = { ILS: 1, USD: 0.28, EUR: 0.25 };
let cart = JSON.parse(localStorage.getItem('shoppingCart')) || []; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Authentication Check ---
    const authRes = await fetch('/api/current-user');
    const authData = await authRes.json();
    
    if (authData.loggedIn) {
        if(document.getElementById('loginLink')) document.getElementById('loginLink').style.display = 'none';
        if(document.getElementById('logoutBtn')) document.getElementById('logoutBtn').style.display = 'inline';
        if (authData.user.role === 'admin' && document.getElementById('adminLink')) {
            document.getElementById('adminLink').style.display = 'inline';
        }
    }

    if (document.getElementById('logoutBtn')) {
        document.getElementById('logoutBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/logout');
            window.location.href = 'index.html';
        });
    }

    // --- Home Page Logic ---
    if (document.getElementById('productsContainer')) {
        try {
            // API 1: Currency Rates
            const currencyRes = await fetch('https://api.exchangerate-api.com/v4/latest/ILS');
            const currencyData = await currencyRes.json();
            exchangeRates = currencyData.rates;

            // API 2: Shipping Destinations
            const countriesRes = await fetch('https://flagcdn.com/en/codes.json');
            const countriesData = await countriesRes.json();
            
            const countries = Object.values(countriesData);
            countries.sort((a, b) => a.localeCompare(b));
            
            const shippingSelect = document.getElementById('shippingCountry');
            shippingSelect.innerHTML = '<option value="">Select Destination...</option>';
            
            countries.forEach(name => {
                shippingSelect.innerHTML += `<option value="${name}">${name}</option>`;
            });

        } catch (err) {
            console.error("API load error", err);
        }

        loadStoreProducts();
        renderCart();

        // Event listeners
        document.getElementById('currency').addEventListener('change', loadStoreProducts);
        document.getElementById('sortProducts').addEventListener('change', loadStoreProducts);

        document.getElementById('checkoutBtn').addEventListener('click', () => {
            if (cart.length === 0) return alert('Your cart is empty!');
            const dest = document.getElementById('shippingCountry').value;
            if (!dest) return alert('Please select a shipping destination first!');
            
            alert(`Checkout completed successfully! Your order is being prepared for shipping to ${dest}.`);
            cart = [];
            saveCart();
            renderCart();
        });
    }

    // --- Admin Page Logic ---
    if (document.getElementById('productsTable')) {
        loadAdminProducts();
        loadAggregations();

        // Create Product
        document.getElementById('addBtn').addEventListener('click', async () => {
            const name = document.getElementById('prodName').value;
            const setNumber = document.getElementById('prodSetNumber').value;
            const pieces = document.getElementById('prodPieces').value;
            const price = document.getElementById('prodPrice').value;
            
            if(!name || !pieces || !price || !setNumber) return alert('Fill all fields');

            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, setNumber, pieces, price })
            });
            
            document.getElementById('prodName').value = '';
            document.getElementById('prodSetNumber').value = '';
            document.getElementById('prodPieces').value = '';
            document.getElementById('prodPrice').value = '';
            
            loadAdminProducts();
            loadAggregations();
        });

        // Close Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('editModal').style.display = 'none';
        });

        // Update Product
        document.getElementById('saveEditBtn').addEventListener('click', async () => {
            const id = document.getElementById('editId').value;
            const name = document.getElementById('editName').value;
            const setNumber = document.getElementById('editSetNumber').value;
            const pieces = document.getElementById('editPieces').value;
            const price = document.getElementById('editPrice').value;

            await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, setNumber, pieces, price })
            });

            document.getElementById('editModal').style.display = 'none';
            loadAdminProducts();
            loadAggregations();
        });
    }

    // --- Auth Forms Logic ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;

            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            document.getElementById('regMsg').innerText = data.msg;
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = data.role === 'admin' ? 'admin.html' : 'index.html';
            } else {
                document.getElementById('loginMsg').innerText = data.msg;
            }
        });
    }
});

// ==========================================
// --- Helper Functions ---
// ==========================================

async function loadStoreProducts() {
    const sortVal = document.getElementById('sortProducts').value.split('_');
    const currency = document.getElementById('currency').value;
    
    const res = await fetch(`/api/products?sort=${sortVal[0]}&order=${sortVal[1]}`);
    const products = await res.json();
    
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    const fallbackImage = 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=400';

    products.forEach(p => {
        const convertedPrice = (p.price * exchangeRates[currency]).toFixed(2);
        const symbol = currency === 'ILS' ? '₪' : (currency === 'USD' ? '$' : '€');
        
        // Construct dynamic image URL based on setNumber
        const imgUrl = p.setNumber ? `https://images.brickset.com/sets/images/${p.setNumber}-1.jpg` : fallbackImage;

        container.innerHTML += `
            <div class="product-card">
                <img src="${imgUrl}" alt="${p.name}" class="product-img" onerror="this.src='${fallbackImage}'">
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p style="color:#888;">Set #${p.setNumber || 'N/A'}</p>
                    <p>🧩 ${p.pieces} Pieces</p>
                    <div style="flex-grow: 1;"></div>
                    <h4>${convertedPrice}${symbol}</h4>
                    <button class="btn-add" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', ${p.price})">Add to Cart</button>
                </div>
            </div>
        `;
    });
}

window.addToCart = (name, price) => {
    cart.push({ name, price });
    saveCart();
    renderCart();
};

function saveCart() { localStorage.setItem('shoppingCart', JSON.stringify(cart)); }

function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotal');
    
    container.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        container.innerHTML += `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>₪${item.price} <a href="#" onclick="removeFromCart(${index}); return false;" style="color:#e3000f; text-decoration:none; margin-left:10px; font-weight:bold;">X</a></span>
            </div>
        `;
    });
    totalEl.innerText = total.toFixed(2);
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

async function loadAdminProducts() {
    const res = await fetch('/api/products');
    const products = await res.json();
    
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';

    products.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${p.setNumber || '-'}</td>
                <td>${p.pieces}</td>
                <td>₪${p.price}</td>
                <td>
                    <button onclick="openEditModal('${p._id}', '${p.name.replace(/'/g, "\\'")}', '${p.setNumber}', ${p.pieces}, ${p.price})" style="width:auto; padding:5px 10px; background:lightblue; color:black;">Edit</button>
                    <button onclick="deleteProduct('${p._id}')" style="width:auto; padding:5px 10px; background:salmon; color:black;">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.openEditModal = (id, name, setNumber, pieces, price) => {
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editSetNumber').value = setNumber !== 'undefined' ? setNumber : '';
    document.getElementById('editPieces').value = pieces;
    document.getElementById('editPrice').value = price;
    document.getElementById('editModal').style.display = 'block';
};

window.deleteProduct = async (id) => {
    if(confirm("Are you sure you want to delete this set?")) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        loadAdminProducts();
        loadAggregations();
    }
};

async function loadAggregations() {
    const statsContainer = document.getElementById('statsContainer');
    const [overviewRes, catRes] = await Promise.all([ fetch('/api/stats/overview'), fetch('/api/stats/categories') ]);
    
    const overview = await overviewRes.json();
    const categories = await catRes.json();

    let html = `<p><strong>Total Sets:</strong> ${overview.count} | <strong>Avg Price:</strong> ₪${overview.avgPrice ? overview.avgPrice.toFixed(2) : 0} | <strong>Total Pieces:</strong> ${overview.totalPieces}</p><hr><p><strong>Inventory Breakdown:</strong><br>`;
    categories.forEach(c => { html += `- ${c._id}: ${c.count} sets<br>`; });
    statsContainer.innerHTML = html + "</p>";
}