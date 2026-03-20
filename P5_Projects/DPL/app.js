/**
 * Salesforce Price List - Simulation
 * Vanilla HTML/CSS/JS simulation of the Digital Pricelist Tool
 */

// ============ Mock Data - Hierarchical Categories ============
const MOCK_CATEGORIES = [
    {
        id: 'sales',
        name: 'Sales',
        products: [
            {
                id: '1',
                name: 'Sales Cloud',
                sku: 'SF-SC-001',
                monthly: 75,
                annual: 900,
                children: [
                    { id: '1-1', name: 'Sales Cloud - Enterprise', sku: 'SF-SC-E-001', monthly: 150, annual: 1800, children: [
                        { id: '1-1-1', name: 'Sales Cloud - Enterprise - User', sku: 'SF-SC-E-U', monthly: 150, annual: 1800, children: [] }
                    ]},
                    { id: '1-2', name: 'Sales Cloud - Professional', sku: 'SF-SC-P-001', monthly: 75, annual: 900, children: [
                        { id: '1-2-1', name: 'Sales Cloud - Professional - User', sku: 'SF-SC-P-U', monthly: 75, annual: 900, children: [] }
                    ]}
                ]
            },
            { id: 'rev', name: 'Revenue Cloud', sku: 'SF-RC-001', monthly: 150, annual: 1800, children: [] }
        ]
    },
    {
        id: 'service',
        name: 'Service',
        products: [
            {
                id: '2',
                name: 'Service Cloud',
                sku: 'SF-SVC-001',
                monthly: 75,
                annual: 900,
                children: [
                    { id: '2-1', name: 'Service Cloud - Enterprise', sku: 'SF-SVC-E-001', monthly: 150, annual: 1800, children: [
                        { id: '2-1-1', name: 'Service Cloud - Enterprise - Agent', sku: 'SF-SVC-E-A', monthly: 150, annual: 1800, children: [] }
                    ]}
                ]
            }
        ]
    },
    {
        id: 'data-ai',
        name: 'Data and AI',
        /* Gray category bar only — expanding shows these three rows (no duplicate “Data and AI” white row) */
        products: [
            {
                id: 'dai-d360',
                name: 'Data 360',
                sku: 'SF-D360-001',
                children: [
                    {
                        id: 'dai-d360-flex',
                        name: 'Flex Credits (100k)',
                        sku: 'SF-D360-FLX',
                        monthly: 500,
                        annual: 6000,
                        children: [],
                    },
                    {
                        id: 'dai-d360-profiles',
                        name: 'Profiles',
                        sku: 'SF-D360-PRF',
                        monthly: 2400,
                        annual: 28800,
                        children: [],
                    },
                    {
                        id: 'dai-d360-ent',
                        name: 'Enterprise Profiles',
                        sku: 'SF-D360-ENT',
                        monthly: 4200,
                        annual: 50400,
                        children: [],
                    },
                ],
            },
            {
                id: 'dai-agentforce',
                name: 'Agentforce',
                sku: 'SF-AGF-001',
                children: [
                    {
                        id: 'dai-agf-flex',
                        name: 'Flex Credits (100k)',
                        sku: 'SF-AGF-FLX',
                        monthly: 500,
                        annual: 6000,
                        children: [],
                    },
                    {
                        id: 'dai-agf-conv',
                        name: 'Conversations',
                        sku: 'SF-AGF-CONV',
                        monthly: 2,
                        annual: 24,
                        children: [],
                    },
                ],
            },
            {
                id: 'dai-regrello',
                name: 'Regrello',
                sku: 'SF-RGL-001',
                isExpandableMenu: true,
                children: [],
            },
        ],
    },
    {
        id: 'analytics',
        name: 'Analytics',
        products: [
            {
                id: '4',
                name: 'Tableau',
                sku: 'TB-001',
                monthly: 70,
                annual: 840,
                children: [
                    { id: '4-1', name: 'Tableau - Creator', sku: 'TB-CREATOR', monthly: 70, annual: 840, children: [] },
                    { id: '4-2', name: 'Tableau - Explorer', sku: 'TB-EXPLORER', monthly: 42, annual: 504, children: [] },
                    { id: '4-3', name: 'Tableau - Viewer', sku: 'TB-VIEWER', monthly: 15, annual: 180, children: [] }
                ]
            }
        ]
    },
    {
        id: 'marketing',
        name: 'Marketing',
        products: [
            {
                id: '3',
                name: 'Marketing Cloud',
                sku: 'SF-MC-001',
                monthly: 1200,
                annual: 14400,
                children: [
                    { id: '3-1', name: 'Marketing Cloud - Account Engagement', sku: 'SF-MC-AE', monthly: 1250, annual: 15000, children: [] }
                ]
            }
        ]
    },
    {
        id: 'platform',
        name: 'Platform & Integration',
        products: [
            { id: '5', name: 'Slack', sku: 'SLK-001', monthly: 7.25, annual: 87, children: [] },
            {
                id: '6',
                name: 'MuleSoft',
                sku: 'MS-001',
                monthly: 2500,
                annual: 30000,
                children: [
                    { id: '6-1', name: 'MuleSoft - Anypoint Platform', sku: 'MS-AP', monthly: 2500, annual: 30000, children: [] }
                ]
            }
        ]
    }
];

const MOCK_ACCOUNTS = [
    { id: 'acc-1', name: 'Acme Corporation', totalContractValue: '$125,000', updatedAt: '2 hours ago', isFavorite: false },
    { id: 'acc-2', name: 'Global Tech Inc', totalContractValue: '$89,500', updatedAt: '5 hours ago', isFavorite: true },
    { id: 'acc-3', name: 'Enterprise Solutions Ltd', totalContractValue: '$245,000', updatedAt: '1 day ago', isFavorite: false },
    { id: 'acc-4', name: 'Cloud First Industries', totalContractValue: '$67,200', updatedAt: '2 days ago', isFavorite: false },
    { id: 'acc-5', name: 'Digital Transform Co', totalContractValue: '$312,000', updatedAt: '3 days ago', isFavorite: true },
];

const MOCK_SCRATCHPADS = [
    {
        id: 'sp-1',
        name: 'Acme - Q1 2025 Proposal',
        account: 'Acme Corporation',
        updatedAt: 'Mar 15, 2025',
        productCount: 2,
        pricingMode: 'MONTHLY',
        lines: [
            {
                lineId: 'sp-1-a',
                productId: 'dai-d360-flex',
                name: 'Flex Credits (100k)',
                sku: 'SF-D360-FLX',
                qty: 10,
                discountPct: '',
                approvalLevel: 'Level 1',
                annualOnly: true,
            },
            {
                lineId: 'sp-1-b',
                productId: 'line-only-d360-1k',
                name: 'Data 360 Profiles (1,000)',
                sku: 'SF-D360-1K',
                qty: 10,
                listPricePU: 20,
                discountPct: '',
                approvalLevel: 'Level 0',
                annualOnly: false,
            },
        ],
    },
    {
        id: 'sp-2',
        name: 'Global Tech - Renewal',
        account: 'Global Tech Inc',
        updatedAt: 'Mar 10, 2025',
        productCount: 1,
        pricingMode: 'MONTHLY',
        lines: [
            {
                lineId: 'sp-2-a',
                productId: '4-1',
                name: 'Tableau - Creator',
                sku: 'TB-CREATOR',
                qty: 5,
                discountPct: '',
                approvalLevel: 'Level 0',
                annualOnly: false,
            },
        ],
    },
    {
        id: 'sp-3',
        name: 'Enterprise - Expansion',
        account: 'Enterprise Solutions Ltd',
        updatedAt: 'Mar 5, 2025',
        productCount: 1,
        pricingMode: 'ANNUAL',
        lines: [
            {
                lineId: 'sp-3-a',
                productId: '6-1',
                name: 'MuleSoft - Anypoint Platform',
                sku: 'MS-AP',
                qty: 1,
                discountPct: '',
                approvalLevel: 'Level 1',
                annualOnly: false,
            },
        ],
    },
];

// ============ State ============
let state = {
    selectedProducts: [],
    allProductsExpanded: true,
    favoritesExpanded: false,
    expandedCategories: {
        sales: true,
        service: false,
        'data-ai': false,
        analytics: false,
        marketing: false,
        platform: false,
    },
    expandedProducts: {},
    currentRoute: '/',
    country: 'United States',
    currency: 'USD',
    categories: JSON.parse(JSON.stringify(MOCK_CATEGORIES)),
    accounts: [...MOCK_ACCOUNTS],
    scratchpads: JSON.parse(JSON.stringify(MOCK_SCRATCHPADS)),
    /** When set, next Add to Scratchpad merges lines into this scratchpad */
    mergeTargetScratchpadId: null,
};

function getProductById(id) {
    function find(items) {
        for (const p of items) {
            if (p.id === id) return p;
            const found = p.children && find(p.children);
            if (found) return found;
        }
        return null;
    }
    for (const cat of state.categories) {
        const found = find(cat.products);
        if (found) return found;
    }
    return null;
}

/** Row shows expand/collapse (has children or is an expandable menu folder). */
function isExpandableRow(product) {
    return (
        (product.children && product.children.length > 0) ||
        product.isExpandableMenu === true
    );
}

/** Row can be added to scratchpad (real product leaf, not an expandable menu folder). */
function isSelectableLeaf(product) {
    const noChildren = !product.children || product.children.length === 0;
    return noChildren && !product.isExpandableMenu;
}

// ============ Greeting ============
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

// ============ Routing ============
function initRouting() {
    let route = (location.hash || '#/').slice(1) || '/';
    if (!route.startsWith('/')) route = '/' + route;
    state.currentRoute = route;

    document.getElementById('mainContent')?.classList.toggle('has-price-list-banner', route === '/');

    const scratchEdit = route.match(/^\/scratchpad\/([^/]+)$/);
    const isScratchEdit = !!scratchEdit;

    document.querySelectorAll('.tab-link').forEach(link => {
        const r = link.getAttribute('data-route');
        link.classList.toggle('active', !isScratchEdit && r === route);
    });

    document.querySelectorAll('.page').forEach(page => {
        const pageId = page.id;
        const isActive =
            (route === '/' && pageId === 'page-price-list') ||
            (route === '/accounts' && pageId === 'page-accounts') ||
            (route === '/scratchpads' && pageId === 'page-scratchpads') ||
            (route === '/pricing-estimator' && pageId === 'page-pricing-estimator') ||
            (isScratchEdit && pageId === 'page-scratchpad-edit');
        page.classList.toggle('active', isActive);
    });

    if (route === '/') renderProducts();
    if (route === '/accounts') renderAccounts();
    if (route === '/scratchpads') renderScratchpads();
    if (route === '/pricing-estimator') renderPricingEstimator();
    if (isScratchEdit) renderScratchpadEditor(scratchEdit[1]);
}

function navigateTo(path, opts = {}) {
    const p = path && path.startsWith('/') ? path : '/' + (path || '');
    if (p === '/' && !opts.preserveMergeTarget) {
        state.mergeTargetScratchpadId = null;
    }
    location.hash = p;
    initRouting();
}

window.addEventListener('hashchange', initRouting);

// ============ Product Selection ============
function toggleProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;

    if (!isSelectableLeaf(product)) return; // Only selectable leaves (not expandable menu rows)

    const idx = state.selectedProducts.findIndex(p => p.id === productId);
    if (idx >= 0) {
        state.selectedProducts.splice(idx, 1);
    } else {
        state.selectedProducts.push({ id: product.id, name: product.name });
    }
    updateProductSelection();
    renderSelectedProductsSlider();
}

function removeProductFromSlider(productId) {
    state.selectedProducts = state.selectedProducts.filter(p => p.id !== productId);
    updateProductSelection();
    renderSelectedProductsSlider();
    renderAllProductsAccordion();
}

function updateProductSelection() {
    document.querySelectorAll('.product-checkbox').forEach(cb => {
        const productId = cb.dataset.productId;
        cb.checked = state.selectedProducts.some(p => p.id === productId);
    });
    const btn = document.getElementById('addToScratchpadBtn');
    if (btn) {
        btn.disabled = state.selectedProducts.length === 0;
        btn.textContent = state.selectedProducts.length > 0
            ? `Add to Scratchpad (${state.selectedProducts.length})`
            : 'Add to Scratchpad';
    }
}

// ============ Accordion Helpers ============
function toggleCategory(categoryId) {
    state.expandedCategories[categoryId] = !state.expandedCategories[categoryId];
    renderAllProductsAccordion();
}

function toggleProductExpand(productId) {
    state.expandedProducts[productId] = !state.expandedProducts[productId];
    renderAllProductsAccordion();
}

function toggleAllProducts() {
    state.allProductsExpanded = !state.allProductsExpanded;
    const body = document.getElementById('allProductsBody');
    const chevron = document.getElementById('chevron-all');
    if (body) body.classList.toggle('collapsed', !state.allProductsExpanded);
    if (chevron) chevron.textContent = state.allProductsExpanded ? '▼' : '▶';
    if (state.allProductsExpanded) renderAllProductsAccordion();
}

function toggleFavoritesSection() {
    state.favoritesExpanded = !state.favoritesExpanded;
    const body = document.getElementById('favoritesBody');
    const chevron = document.getElementById('chevron-favorites');
    if (body) body.classList.toggle('collapsed', !state.favoritesExpanded);
    if (chevron) chevron.textContent = state.favoritesExpanded ? '▼' : '▶';
}

function currencyButtonLabel(code) {
    const map = { USD: 'USD ($)', EUR: 'EUR (€)', GBP: 'GBP (£)' };
    return map[code] || code;
}

// ============ Render All Products Accordion ============
function renderProductRow(product, indent, priceFilter) {
    const canExpand = isExpandableRow(product);
    const showCheckbox = isSelectableLeaf(product);
    const isExpanded = state.expandedProducts[product.id] === true;
    const price = priceFilter === 'MONTHLY' ? product.monthly : product.annual;
    const isChecked = state.selectedProducts.some(sp => sp.id === product.id);

    const paddingLeft = 4 + indent * 22;
    const linkAction = canExpand
        ? `toggleProductExpand('${product.id}')`
        : showCheckbox
          ? `toggleProduct('${product.id}')`
          : '';

    let html = `
        <div class="category-row product-row ${canExpand ? 'has-children' : ''} ${product.isExpandableMenu ? 'product-row-menu' : ''}" data-depth="${indent}">
            <div class="row-product" style="padding-left: ${paddingLeft}px">
                <span class="chevron-btn ${canExpand ? '' : 'chevron-placeholder'}" onclick="event.stopPropagation(); ${canExpand ? `toggleProductExpand('${product.id}')` : ''}">
                    ${canExpand ? (isExpanded ? '▼' : '▶') : ''}
                </span>
                <span class="product-name">
                    ${showCheckbox ? `<input type="checkbox" class="product-checkbox" data-product-id="${product.id}" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); toggleProduct('${product.id}')">` : ''}
                    <a href="#" class="product-link" onclick="event.preventDefault(); ${linkAction}">${product.name}</a>
                </span>
            </div>
            <div class="row-price">${price != null ? `$${price}` : '-'}</div>
            <div class="row-resources-host">
                <div class="row-resources"></div>
            </div>
        </div>
    `;

    if (isExpanded && product.children && product.children.length > 0) {
        product.children.forEach(child => {
            html += renderProductRow(child, indent + 1, priceFilter);
        });
    }

    return html;
}

function renderCategory(category, priceFilter) {
    const isExpanded = state.expandedCategories[category.id];
    const categoryName = category.name.replace(/-/g, ' ');

    let html = `
        <div class="category-row category-header" onclick="toggleCategory('${category.id}')">
            <div class="row-product">
                <span class="chevron-btn">${isExpanded ? '▼' : '▶'}</span>
                <span class="product-name"><a href="#" class="product-link category-link" onclick="event.preventDefault(); toggleCategory('${category.id}')">${categoryName}</a></span>
            </div>
            <div class="row-price"></div>
            <div class="row-resources-host">
                <div class="row-resources"></div>
            </div>
        </div>
    `;

    if (isExpanded) {
        category.products.forEach(product => {
            html += renderProductRow(product, 0, priceFilter);
        });
    }

    return html;
}

function renderAllProductsAccordion() {
    const search = (document.getElementById('productSearch') || {}).value || '';
    const priceFilter = (document.getElementById('priceFilter') || {}).value || 'MONTHLY';

    const container = document.getElementById('allProductsAccordionContent');
    if (!container) return;

    let html = '';
    state.categories.forEach(category => {
        const filteredProducts = search
            ? category.products.filter(p => {
                function matches(item) {
                    if (item.name.toLowerCase().includes(search.toLowerCase())) return true;
                    return item.children && item.children.some(matches);
                }
                return matches(p);
            })
            : category.products;

        if (filteredProducts.length === 0) return;

        const filteredCategory = { ...category, products: filteredProducts };
        html += renderCategory(filteredCategory, priceFilter);
    });

    container.innerHTML = html;
    updateProductSelection();
}

function renderProducts() {
    renderAllProductsAccordion();
}

function renderSelectedProductsSlider() {
    const container = document.getElementById('selectedProductsSlider');
    if (!container) return;

    container.innerHTML = state.selectedProducts.map(p => `
        <span class="pill">
            ${p.name}
            <button class="pill-remove" onclick="removeProductFromSlider('${p.id}')" title="Remove">×</button>
        </span>
    `).join('');
}

// ============ Scratchpad: helpers ============
function formatMoney(n) {
    const x = Number(n) || 0;
    return x.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function getListPricePUForProduct(productId, pricingMode) {
    const p = getProductById(productId);
    if (!p) return 0;
    const v = pricingMode === 'MONTHLY' ? p.monthly : p.annual;
    return Number(v) || 0;
}

function approvalLevelForPU(pu) {
    return Number(pu) >= 500 ? 'Level 1' : 'Level 0';
}

function hydrateScratchpadLine(line, pricingMode) {
    const fromCatalog = getListPricePUForProduct(line.productId, pricingMode);
    const pu =
        fromCatalog > 0 ? fromCatalog : Number(line.listPricePU) || 0;
    return {
        ...line,
        listPricePU: pu,
        approvalLevel:
            line.approvalLevel || approvalLevelForPU(pu),
    };
}

function buildScratchpadLinesFromSelection(selectedProducts, pricingMode) {
    return selectedProducts.map((sel, i) => {
        const p = getProductById(sel.id);
        const pu = getListPricePUForProduct(sel.id, pricingMode);
        return {
            lineId: `l-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
            productId: sel.id,
            name: sel.name,
            sku: p?.sku || '—',
            qty: 10,
            listPricePU: pu,
            discountPct: '',
            approvalLevel: approvalLevelForPU(pu),
            annualOnly: /Flex Credits/i.test(sel.name),
        };
    });
}

function getScratchpadById(id) {
    return state.scratchpads.find((s) => s.id === id);
}

function parseDiscount(raw) {
    if (raw === '' || raw === null || raw === undefined) return 0;
    const n = parseFloat(String(raw).replace(/%/g, ''));
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

function lineCalculations(line) {
    const qty = Math.max(0, Number(line.qty) || 0);
    const listPU = Number(line.listPricePU) || 0;
    const disc = parseDiscount(line.discountPct);
    const listPrice = qty * listPU;
    const netPU = listPU * (1 - disc / 100);
    const netPrice = qty * netPU;
    return { qty, listPU, disc, listPrice, netPU, netPrice };
}

// ============ Add to Scratchpad ============
function addToScratchpad() {
    if (state.selectedProducts.length === 0) return;

    const pricingMode =
        (document.getElementById('priceFilter') || {}).value || 'MONTHLY';
    const newLines = buildScratchpadLinesFromSelection(
        state.selectedProducts,
        pricingMode
    );

    const mergeId = state.mergeTargetScratchpadId;
    if (mergeId) {
        const sp = getScratchpadById(mergeId);
        if (sp) {
            sp.lines = sp.lines || [];
            sp.lines.push(...newLines);
            sp.productCount = sp.lines.length;
            sp.pricingMode = pricingMode;
            sp.lines = sp.lines.map((l) => hydrateScratchpadLine(l, sp.pricingMode));
            state.mergeTargetScratchpadId = null;
            state.selectedProducts = [];
            renderSelectedProductsSlider();
            updateProductSelection();
            renderAllProductsAccordion();
            navigateTo('/scratchpad/' + mergeId);
            return;
        }
        state.mergeTargetScratchpadId = null;
    }

    const id = 'sp-' + Date.now();
    const name = `Scratchpad — ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })}`;
    const sp = {
        id,
        name,
        account: 'Price List',
        updatedAt: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }),
        productCount: newLines.length,
        pricingMode,
        lines: newLines.map((l) => hydrateScratchpadLine(l, pricingMode)),
    };
    state.scratchpads.unshift(sp);

    state.selectedProducts = [];
    renderSelectedProductsSlider();
    updateProductSelection();
    renderAllProductsAccordion();
    navigateTo('/scratchpad/' + id);
}

// ============ Filter Products ============
function filterProducts() {
    renderProducts();
}

// ============ Render Accounts ============
function renderAccounts() {
    const tbody = document.getElementById('accountTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.accounts.map(acc => `
        <tr>
            <td>${acc.name}</td>
            <td>${acc.totalContractValue}</td>
            <td>${acc.updatedAt}</td>
            <td>
                <button class="btn-neutral" onclick="openNewScratchpad('${acc.id}')">New Scratchpad</button>
                <button class="btn-neutral" onclick="openSavedScratchpads('${acc.id}')">Saved Scratchpads</button>
            </td>
        </tr>
    `).join('');
}

function searchAccounts() {
    const search = (document.getElementById('accountSearch') || {}).value || '';
    if (!search) {
        state.accounts = [...MOCK_ACCOUNTS];
    } else {
        state.accounts = MOCK_ACCOUNTS.filter(a =>
            a.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    renderAccounts();
}

function resetAccounts() {
    document.getElementById('accountSearch').value = '';
    state.accounts = [...MOCK_ACCOUNTS];
    renderAccounts();
}

function openNewScratchpad(accountId) {
    alert('Opening New Scratchpad for account...\n\n(In the real app, this would navigate to Current Assets.)');
}

function openSavedScratchpads(accountId) {
    navigateTo('/scratchpads');
}

// ============ Pricing Estimator tab ============
function renderPricingEstimator() {
    /* Placeholder for future estimator UI; tab route is active. */
}

// ============ Render Scratchpads ============
function renderScratchpads() {
    const container = document.getElementById('scratchpadList');
    if (!container) return;

    if (state.scratchpads.length === 0) {
        container.innerHTML =
            '<p class="scratchpad-empty">No saved scratchpads yet. Add products on the price list and click <strong>Add to Scratchpad</strong>.</p>';
        return;
    }

    container.innerHTML = state.scratchpads
        .map(
            (sp) => `
        <div class="scratchpad-item" role="button" tabindex="0" onclick="openScratchpad('${sp.id}')" onkeydown="if(event.key==='Enter')openScratchpad('${sp.id}')">
            <div>
                <span class="scratchpad-name">${escapeHtml(sp.name)}</span>
                <div class="scratchpad-meta">${escapeHtml(sp.account)} • ${sp.productCount || (sp.lines && sp.lines.length) || 0} products • ${escapeHtml(sp.updatedAt)}</div>
            </div>
            <button type="button" class="btn-brand" onclick="event.stopPropagation(); openScratchpad('${sp.id}')">Open</button>
        </div>
    `
        )
        .join('');
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function openScratchpad(id) {
    navigateTo('/scratchpad/' + id);
}

// ============ Scratchpad editor ============
function ensureScratchpadLines(sp) {
    if (!sp.lines || !Array.isArray(sp.lines)) sp.lines = [];
    sp.lines = sp.lines.map((l) =>
        hydrateScratchpadLine(l, sp.pricingMode || 'MONTHLY')
    );
    sp.productCount = sp.lines.length;
}

function renderScratchpadEditor(scratchpadId) {
    const sp = getScratchpadById(scratchpadId);
    if (!sp) {
        navigateTo('/scratchpads');
        return;
    }
    ensureScratchpadLines(sp);

    const countryEl = document.getElementById('scratchpadMetaCountry');
    const currencyEl = document.getElementById('scratchpadMetaCurrency');
    if (countryEl) countryEl.textContent = state.country;
    if (currencyEl)
        currencyEl.textContent =
            state.currency === 'USD'
                ? 'USD ($)'
                : state.currency === 'GBP'
                  ? 'GBP (£)'
                  : state.currency === 'EUR'
                    ? 'EUR (€)'
                    : state.currency;

    const pricingSel = document.getElementById('scratchpadPricingSelect');
    if (pricingSel) {
        pricingSel.value = sp.pricingMode || 'MONTHLY';
    }

    const tbody = document.getElementById('scratchpadTableBody');
    if (!tbody) return;

    tbody.innerHTML = sp.lines
        .map((line, idx) => scratchpadEditorRowHtml(sp.id, line, idx))
        .join('');

    recalcScratchpadTotals(scratchpadId);
}

function scratchpadEditorRowHtml(scratchpadId, line) {
    const { qty, listPU, listPrice, netPU, netPrice } = lineCalculations(line);
    const annualTag = line.annualOnly
        ? '<span class="scratchpad-tag-annual">Annual Only</span>'
        : '';
    const discVal =
        line.discountPct === '' || line.discountPct === undefined
            ? ''
            : line.discountPct;

    return `
        <tr data-line-id="${line.lineId}">
            <td class="scratchpad-product-cell">
                <span class="scratchpad-product-name">${escapeHtml(line.name)}</span>
                <button type="button" class="scratchpad-info-btn" title="Info" aria-label="Product info">i</button>
                ${annualTag}
            </td>
            <td><a href="#" class="scratchpad-dam-link" onclick="event.preventDefault()">DAM &gt;</a></td>
            <td><input type="number" min="0" step="1" class="scratchpad-input scratchpad-input-qty" value="${qty}"
                aria-label="Quantity for ${escapeHtml(line.name)}"
                onchange="scratchpadLineQtyChange('${scratchpadId}','${line.lineId}',this.value)" /></td>
            <td class="num">${qty}</td>
            <td class="num">${formatMoney(listPU)}</td>
            <td class="num">${formatMoney(listPrice)}</td>
            <td><input type="text" class="scratchpad-input scratchpad-input-discount" placeholder=""
                value="${discVal}"
                aria-label="Discount percent for ${escapeHtml(line.name)}"
                onchange="scratchpadLineDiscountChange('${scratchpadId}','${line.lineId}',this.value)" /></td>
            <td class="num">${formatMoney(netPU)}</td>
            <td class="num">${formatMoney(netPrice)}</td>
            <td>${escapeHtml(line.approvalLevel || '—')}</td>
            <td class="num">—</td>
            <td><button type="button" class="scratchpad-delete-btn" title="Remove line" aria-label="Remove" onclick="scratchpadRemoveLine('${scratchpadId}','${line.lineId}')">🗑</button></td>
        </tr>
    `;
}

function recalcScratchpadTotals(scratchpadId) {
    const sp = getScratchpadById(scratchpadId);
    if (!sp || !sp.lines) return;

    let listSum = 0;
    let netSum = 0;
    sp.lines.forEach((line) => {
        const c = lineCalculations(line);
        listSum += c.listPrice;
        netSum += c.netPrice;
    });

    const listEl = document.getElementById('scratchpadTotalList');
    const netEl = document.getElementById('scratchpadTotalNet');
    if (listEl) listEl.textContent = formatMoney(listSum);
    if (netEl) netEl.textContent = formatMoney(netSum);
}

function scratchpadLineQtyChange(scratchpadId, lineId, value) {
    const sp = getScratchpadById(scratchpadId);
    if (!sp) return;
    const line = sp.lines.find((l) => l.lineId === lineId);
    if (!line) return;
    line.qty = Math.max(0, parseInt(value, 10) || 0);
    renderScratchpadEditor(scratchpadId);
}

function scratchpadLineDiscountChange(scratchpadId, lineId, value) {
    const sp = getScratchpadById(scratchpadId);
    if (!sp) return;
    const line = sp.lines.find((l) => l.lineId === lineId);
    if (!line) return;
    line.discountPct = value === '' ? '' : String(value).replace(/[^\d.%]/g, '');
    renderScratchpadEditor(scratchpadId);
}

function scratchpadRemoveLine(scratchpadId, lineId) {
    const sp = getScratchpadById(scratchpadId);
    if (!sp || !sp.lines) return;
    sp.lines = sp.lines.filter((l) => l.lineId !== lineId);
    sp.productCount = sp.lines.length;
    if (sp.lines.length === 0) {
        state.scratchpads = state.scratchpads.filter((s) => s.id !== scratchpadId);
        navigateTo('/scratchpads');
        return;
    }
    renderScratchpadEditor(scratchpadId);
}

function onScratchpadPricingChange() {
    const m = state.currentRoute.match(/^\/scratchpad\/([^/]+)$/);
    if (!m) return;
    const sp = getScratchpadById(m[1]);
    if (!sp) return;
    const sel = document.getElementById('scratchpadPricingSelect');
    const mode = sel ? sel.value : 'MONTHLY';
    sp.pricingMode = mode;
    sp.lines = sp.lines.map((line) => {
        const fromCat = getListPricePUForProduct(line.productId, mode);
        const pu = fromCat > 0 ? fromCat : Number(line.listPricePU) || 0;
        return { ...line, listPricePU: pu, approvalLevel: approvalLevelForPU(pu) };
    });
    renderScratchpadEditor(m[1]);
}

function onPricingGuidance() {
    window.alert(
        'Pricing Guidance (simulation): In the full app this would open pricing guidance for the scratchpad.'
    );
}

function scratchpadUpdateAddProducts() {
    const routeMatch = state.currentRoute.match(/^\/scratchpad\/([^/]+)$/);
    if (routeMatch) state.mergeTargetScratchpadId = routeMatch[1];
    navigateTo('/', { preserveMergeTarget: true });
}

function scratchpadExport() {
    window.alert(
        'Export to Google Sheets (simulation): A spreadsheet link would be generated in the full app.'
    );
}

function scratchpadSave() {
    const routeMatch = state.currentRoute.match(/^\/scratchpad\/([^/]+)$/);
    if (!routeMatch) return;
    const sp = getScratchpadById(routeMatch[1]);
    if (!sp) return;
    sp.updatedAt = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    window.alert('Scratchpad saved.');
    if (document.getElementById('page-scratchpads')?.classList.contains('active')) {
        renderScratchpads();
    }
}

// ============ Country Modal ============
function openCountryModal() {
    document.getElementById('countryModal').classList.add('open');
}

function closeCountryModal() {
    document.getElementById('countryModal').classList.remove('open');
}

function saveCountryCurrency() {
    const countrySelect = document.getElementById('modalCountry');
    const currencySelect = document.getElementById('modalCurrency');
    const countries = { US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France' };
    state.country = countries[countrySelect.value] || state.country;
    state.currency = currencySelect.value || state.currency;
    const strongs = document.querySelectorAll('.country-btn strong');
    if (strongs[0]) strongs[0].textContent = state.country;
    if (strongs[1]) strongs[1].textContent = currencyButtonLabel(state.currency);
    closeCountryModal();
    const spRoute = state.currentRoute.match(/^\/scratchpad\/([^/]+)$/);
    if (spRoute) renderScratchpadEditor(spRoute[1]);
}

// ============ Tab Navigation ============
document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        navigateTo(route || '/');
    });
});

// ============ Init ============
function init() {
    document.getElementById('greeting').textContent = `${getGreeting()}, User`;
    const body = document.getElementById('allProductsBody');
    if (body) body.classList.toggle('collapsed', !state.allProductsExpanded);
    const chevron = document.getElementById('chevron-all');
    if (chevron) chevron.textContent = state.allProductsExpanded ? '▼' : '▶';
    const favBody = document.getElementById('favoritesBody');
    if (favBody) favBody.classList.toggle('collapsed', !state.favoritesExpanded);
    const favChevron = document.getElementById('chevron-favorites');
    if (favChevron) favChevron.textContent = state.favoritesExpanded ? '▼' : '▶';
    initRouting();
}

init();
