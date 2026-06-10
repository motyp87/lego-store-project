let exchangeRates = { ILS: 1, USD: 0.28, EUR: 0.25 }; // Default fallback

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Auth Check & Navbar Setup
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

    // 2. Load External APIs (Only on index.html)
    if (document.getElementById('weatherWidget')) {
        try {
            // API 1: OpenMeteo Weather (Local coordinates: Petah Tikva)
            const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=32.08&longitude=34.88&current_weather=true');
            const weatherData = await weatherRes.json();
            document.getElementById('weatherWidget').innerHTML = 
                `<strong>Delivery Weather Status:</strong> ${weatherData.current_weather.temperature}°C, Wind: ${weatherData.current_weather.windspeed} km/h. Conditions are good for shipping!`;

            // API 2: ExchangeRate-API (Currency)
            const currencyRes = await fetch('https://api.exchangerate-api.com/v4/latest/ILS');
            const currencyData = await currencyRes.json();
            exchangeRates = currencyData.rates;
        } catch (err) {
            console.log("API load error", err);
        }

        loadStoreProducts();

        document.getElementById('currency').addEventListener('change', loadStoreProducts);
        document.getElementById('sortProducts').addEventListener('change', loadStoreProducts);
    }

    // 3. Admin Panel Logic (Only on admin.html)
    if (document.getElementById('productsTable')) {
        loadAdminProducts();
        loadAggregations();

        // Create Product
        document.getElementById('addBtn').addEventListener('click', async () => {
            const name = document.getElementById('prodName').value;
            const pieces = document.getElementById('prodPieces').value;
            const price = document.getElementById('prodPrice').value;
            
            if(!name || !pieces || !price) return alert('Fill all fields');

            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, pieces, price })
            });
            
            document.getElementById('prodName').value = '';
            document.getElementById('prodPieces').value = '';
            document.getElementById('prodPrice').value = '';
            
            loadAdminProducts();
            loadAggregations();
        });
    }

    // Login & Register Form Logic (from Version 2)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const role = document.getElementById('regRole').value;

            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
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

// --- Helper Functions ---

async function loadStoreProducts() {
    const sortVal = document.getElementById('sortProducts').value.split('_');
    const currency = document.getElementById('currency').value;
    
    const res = await fetch(`/api/products?sort=${sortVal[0]}&order=${sortVal[1]}`);
    const products = await res.json();
    
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    products.forEach(p => {
        // Calculate price based on API exchange rate
        const convertedPrice = (p.price * exchangeRates[currency]).toFixed(2);
        const symbol = currency === 'ILS' ? '₪' : (currency === 'USD' ? '$' : '€');

        container.innerHTML += `
            <div class="product-card">
                <h3>${p.name}</h3>
                <p>Pieces: ${p.pieces}</p>
                <h4>Price: ${convertedPrice}${symbol}</h4>
            </div>
        `;
    });
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
                <td>${p.pieces}</td>
                <td>₪${p.price}</td>
                <td>
                    <button onclick="editProduct('${p._id}', '${p.name}', ${p.pieces}, ${p.price})" style="width:auto; padding:5px; background:lightblue;">Edit</button>
                    <button onclick="deleteProduct('${p._id}')" style="width:auto; padding:5px; background:salmon;">Delete</button>
                </td>
            </tr>
        `;
    });
}

// Update Product
window.editProduct = async (id, oldName, oldPieces, oldPrice) => {
    const name = prompt("Update Product Name:", oldName);
    if (!name) return;
    const pieces = prompt("Update Pieces Count:", oldPieces);
    const price = prompt("Update Price (ILS):", oldPrice);

    await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pieces, price })
    });
    loadAdminProducts();
    loadAggregations();
};

// Delete Product
window.deleteProduct = async (id) => {
    if(confirm("Are you sure?")) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        loadAdminProducts();
        loadAggregations();
    }
};

// Aggregations Loader
async function loadAggregations() {
    const statsContainer = document.getElementById('statsContainer');
    
    const [overviewRes, catRes] = await Promise.all([
        fetch('/api/stats/overview'),
        fetch('/api/stats/categories')
    ]);
    
    const overview = await overviewRes.json();
    const categories = await catRes.json();

    let html = `<p><strong>Total Items:</strong> ${overview.count} | <strong>Avg Price:</strong> ₪${overview.avgPrice ? overview.avgPrice.toFixed(2) : 0} | <strong>Total Pieces:</strong> ${overview.totalPieces}</p><hr><p><strong>Inventory Breakdown:</strong><br>`;
    
    categories.forEach(c => {
        html += `- ${c._id}: ${c.count} sets<br>`;
    });

    statsContainer.innerHTML = html + "</p>";
}