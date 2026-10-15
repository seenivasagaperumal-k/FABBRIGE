// =====================================================
// FABBRIDGE - MARKETPLACE.JS
// Category-based requirement marketplace with subcategory filtering & search
// =====================================================

import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
    MANUFACTURING_CATEGORIES,
    getCategoryByNameOrAlias,
    getSubcategoriesForCategory,
    matchCategory,
    getCanonicalCategoryName,
    getCategoryIcon,
    getCategoryImage
} from "./categories.js";

// =====================================================
// DOM ELEMENTS
// =====================================================

const companyGrid = document.getElementById("companyGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const categoryCardsGrid = document.getElementById("categoryCardsGrid");
const subcategoryPillsContainer = document.getElementById("subcategoryPillsContainer");
const subcategoryPillsList = document.getElementById("subcategoryPillsList");
const subFilterLabel = document.getElementById("subFilterLabel");
const resetCategoryBtn = document.getElementById("resetCategoryBtn");
const resultsSummaryBar = document.getElementById("resultsSummaryBar");
const resultsCountText = document.getElementById("resultsCountText");
const activeFilterTags = document.getElementById("activeFilterTags");

// Modal Elements
const modal = document.getElementById("companyModal");
const closeModal = document.getElementById("closeModal");
const quoteBtn = document.getElementById("quoteBtn");
const modalTitle = document.getElementById("modalTitle");
const modalCompany = document.getElementById("modalCompany");
const modalCategory = document.getElementById("modalCategory");
const modalCategoryBadge = document.getElementById("modalCategoryBadge");
const modalSubcategory = document.getElementById("modalSubcategory");
const modalSubcategoryBadge = document.getElementById("modalSubcategoryBadge");
const modalSubcategoryRow = document.getElementById("modalSubcategoryRow");
const modalDescription = document.getElementById("modalDescription");
const modalQuantity = document.getElementById("modalQuantity");
const modalBudget = document.getElementById("modalBudget");
const modalDeadline = document.getElementById("modalDeadline");

// =====================================================
// STATE
// =====================================================

let allRequirements = [];
let selectedRequirement = null;
let activeCategory = "all"; // "all" or category canonical name
let activeSubcategory = "all"; // "all" or specific subcategory string
let activeSearchQuery = "";

// =====================================================
// LOAD REQUIREMENTS FROM FIRESTORE
// =====================================================

async function loadRequirements() {
    try {
        if (companyGrid) {
            companyGrid.innerHTML = `
                <div class="no-results">
                    <p>Loading requirements...</p>
                </div>
            `;
        }

        const snapshot = await getDocs(collection(db, "requirements"));
        allRequirements = [];

        // Cache user lookups to avoid duplicate Firestore calls
        const userCache = new Map();

        for (const requirementDoc of snapshot.docs) {
            const data = requirementDoc.data();
            let companyName = "Company";

            if (data.userId) {
                if (userCache.has(data.userId)) {
                    companyName = userCache.get(data.userId);
                } else {
                    try {
                        const userRef = doc(db, "users", data.userId);
                        const userSnapshot = await getDoc(userRef);
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.data();
                            companyName =
                                userData.companyName ||
                                userData.company ||
                                userData.ownerName ||
                                "Company";
                        }
                    } catch (userError) {
                        console.error("Company loading error:", userError);
                    }
                    userCache.set(data.userId, companyName);
                }
            }

            allRequirements.push({
                id: requirementDoc.id,
                userId: data.userId || "",
                title: data.title || "Untitled Requirement",
                category: data.category || "Other Manufacturing",
                subcategory: data.subcategory || "",
                description: data.description || "No description provided",
                quantity: data.quantity || "Not specified",
                budget: data.budget || "Not specified",
                deadline: data.deadline || "Not specified",
                status: data.status || "Pending",
                companyName: companyName,
                createdAt: data.createdAt || ""
            });
        }

        // Sort newest first
        allRequirements.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        // Render dynamic category cards with actual counts
        renderCategoryCards();

        // Apply filters & render
        applyFiltersAndRender();
    } catch (error) {
        console.error("Error loading requirements:", error);
        if (companyGrid) {
            companyGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-content">
                        <span class="no-results-icon">⚠️</span>
                        <div class="no-results-title">Unable to Load Requirements</div>
                        <p class="no-results-desc">There was a problem loading marketplace requirements. Please check your connection and refresh.</p>
                    </div>
                </div>
            `;
        }
    }
}

// =====================================================
// CATEGORY CARDS RENDERING (CALCULATED FROM ACTUAL DATA)
// =====================================================

function calculateCategoryCounts() {
    const counts = {
        all: allRequirements.length
    };

    // Initialize counts for configured categories
    MANUFACTURING_CATEGORIES.forEach((cat) => {
        counts[cat.name] = 0;
    });

    // Custom categories found in existing data that don't match any configured category
    const extraCategories = new Set();

    allRequirements.forEach((req) => {
        let matched = false;
        for (const cat of MANUFACTURING_CATEGORIES) {
            if (matchCategory(req.category, cat.name)) {
                counts[cat.name]++;
                matched = true;
                break;
            }
        }
        if (!matched && req.category) {
            extraCategories.add(req.category);
            counts[req.category] = (counts[req.category] || 0) + 1;
        }
    });

    return { counts, extraCategories: Array.from(extraCategories) };
}

function renderCategoryCards() {
    if (!categoryCardsGrid) return;

    const { counts, extraCategories } = calculateCategoryCounts();
    categoryCardsGrid.innerHTML = "";

    // 1. "All Categories" Card
    const allCard = document.createElement("div");
    allCard.className = `cat-card ${activeCategory === "all" ? "active" : ""}`;
    allCard.innerHTML = `
        <div class="cat-card-left">
            <span class="cat-card-icon">🌐</span>
            <span class="cat-card-name">All Categories</span>
        </div>
        <span class="cat-card-badge">${counts.all}</span>
    `;
    allCard.addEventListener("click", () => {
        selectCategory("all");
    });
    categoryCardsGrid.appendChild(allCard);

    // 2. Configured Categories Cards
    MANUFACTURING_CATEGORIES.forEach((cat) => {
        const count = counts[cat.name] || 0;
        const card = document.createElement("div");
        card.className = `cat-card ${activeCategory === cat.name ? "active" : ""}`;
        const catImg = cat.image || getCategoryImage(cat.name);
        card.innerHTML = `
            <div class="cat-card-left">
                <img src="${catImg}" alt="${escapeHTML(cat.name)}" class="cat-card-thumb" onerror="this.style.display='none'">
                <span class="cat-card-name">${escapeHTML(cat.name)}</span>
            </div>
            <span class="cat-card-badge">${count}</span>
        `;
        card.addEventListener("click", () => {
            selectCategory(cat.name);
        });
        categoryCardsGrid.appendChild(card);
    });

    // 3. Backward Compatibility: Render any extra custom categories found in database
    extraCategories.forEach((extraCat) => {
        const count = counts[extraCat] || 0;
        const card = document.createElement("div");
        card.className = `cat-card ${activeCategory === extraCat ? "active" : ""}`;
        card.innerHTML = `
            <div class="cat-card-left">
                <span class="cat-card-icon">🏷️</span>
                <span class="cat-card-name">${escapeHTML(extraCat)}</span>
            </div>
            <span class="cat-card-badge">${count}</span>
        `;
        card.addEventListener("click", () => {
            selectCategory(extraCat);
        });
        categoryCardsGrid.appendChild(card);
    });
}

// =====================================================
// SUBCATEGORY PILLS RENDERING
// =====================================================

function renderSubcategoryPills() {
    if (!subcategoryPillsContainer || !subcategoryPillsList) return;

    if (activeCategory === "all") {
        subcategoryPillsContainer.style.display = "none";
        subcategoryPillsList.innerHTML = "";
        return;
    }

    const subcategories = getSubcategoriesForCategory(activeCategory);

    // Also collect any unique subcategories that exist in actual requirements for this category
    const actualSubcategories = new Set(subcategories);
    allRequirements.forEach((req) => {
        if (matchCategory(req.category, activeCategory) && req.subcategory) {
            actualSubcategories.add(req.subcategory);
        }
    });

    const subList = Array.from(actualSubcategories);

    if (subList.length === 0) {
        subcategoryPillsContainer.style.display = "none";
        subcategoryPillsList.innerHTML = "";
        return;
    }

    // Calculate count per subcategory within this category
    const subCounts = {};
    let totalInCat = 0;
    allRequirements.forEach((req) => {
        if (matchCategory(req.category, activeCategory)) {
            totalInCat++;
            if (req.subcategory) {
                subCounts[req.subcategory] = (subCounts[req.subcategory] || 0) + 1;
            }
        }
    });

    subcategoryPillsContainer.style.display = "block";
    if (subFilterLabel) {
        subFilterLabel.textContent = `${activeCategory} Subcategories:`;
    }
    subcategoryPillsList.innerHTML = "";

    // "All" Pill for this category
    const allPill = document.createElement("div");
    allPill.className = `sub-pill ${activeSubcategory === "all" ? "active" : ""}`;
    allPill.innerHTML = `
        <span>All ${escapeHTML(activeCategory)}</span>
        <span class="sub-pill-count">${totalInCat}</span>
    `;
    allPill.addEventListener("click", () => {
        selectSubcategory("all");
    });
    subcategoryPillsList.appendChild(allPill);

    // Individual Subcategory Pills
    subList.forEach((subName) => {
        const count = subCounts[subName] || 0;
        const pill = document.createElement("div");
        pill.className = `sub-pill ${activeSubcategory === subName ? "active" : ""}`;
        pill.innerHTML = `
            <span>${escapeHTML(subName)}</span>
            <span class="sub-pill-count">${count}</span>
        `;
        pill.addEventListener("click", () => {
            selectSubcategory(subName);
        });
        subcategoryPillsList.appendChild(pill);
    });
}

// =====================================================
// FILTERING LOGIC
// =====================================================

function selectCategory(categoryName) {
    activeCategory = categoryName;
    activeSubcategory = "all"; // Reset subcategory when category changes
    renderCategoryCards();
    renderSubcategoryPills();
    applyFiltersAndRender();
}

function selectSubcategory(subName) {
    activeSubcategory = subName;
    renderSubcategoryPills();
    applyFiltersAndRender();
}

function resetAllFilters() {
    activeCategory = "all";
    activeSubcategory = "all";
    activeSearchQuery = "";
    if (searchInput) searchInput.value = "";
    if (clearSearchBtn) clearSearchBtn.style.display = "none";
    renderCategoryCards();
    renderSubcategoryPills();
    applyFiltersAndRender();
}

if (resetCategoryBtn) {
    resetCategoryBtn.addEventListener("click", resetAllFilters);
}

// =====================================================
// APPLY FILTERS & SEARCH
// =====================================================

function applyFiltersAndRender() {
    const queryStr = activeSearchQuery.toLowerCase().trim();

    const filtered = allRequirements.filter((item) => {
        // 1. Category Filter
        if (activeCategory !== "all") {
            if (!matchCategory(item.category, activeCategory)) {
                return false;
            }
        }

        // 2. Subcategory Filter
        if (activeSubcategory !== "all") {
            const reqSub = (item.subcategory || "").trim().toLowerCase();
            const targetSub = activeSubcategory.trim().toLowerCase();
            if (reqSub !== targetSub) {
                return false;
            }
        }

        // 3. Search Filter
        if (queryStr !== "") {
            const titleMatch = (item.title || "").toLowerCase().includes(queryStr);
            const companyMatch = (item.companyName || "").toLowerCase().includes(queryStr);
            const categoryMatch = (item.category || "").toLowerCase().includes(queryStr);
            const subcategoryMatch = (item.subcategory || "").toLowerCase().includes(queryStr);
            const descMatch = (item.description || "").toLowerCase().includes(queryStr);
            const quantityMatch = String(item.quantity || "").toLowerCase().includes(queryStr);
            const budgetMatch = String(item.budget || "").toLowerCase().includes(queryStr);

            if (
                !titleMatch &&
                !companyMatch &&
                !categoryMatch &&
                !subcategoryMatch &&
                !descMatch &&
                !quantityMatch &&
                !budgetMatch
            ) {
                return false;
            }
        }

        return true;
    });

    // Update Reset button visibility
    const isFiltered =
        activeCategory !== "all" ||
        activeSubcategory !== "all" ||
        queryStr !== "";

    if (resetCategoryBtn) {
        resetCategoryBtn.style.display = isFiltered ? "inline-flex" : "none";
    }

    // Update Results Summary Bar
    updateResultsSummary(filtered.length);

    // Display cards
    displayRequirements(filtered);
}

function updateResultsSummary(count) {
    if (!resultsCountText || !activeFilterTags) return;

    // Summary Text
    let label = `Showing <strong>${count}</strong> ${count === 1 ? "requirement" : "requirements"}`;
    if (activeCategory !== "all") {
        label += ` in <strong>${escapeHTML(activeCategory)}</strong>`;
        if (activeSubcategory !== "all") {
            label += ` &gt; <strong>${escapeHTML(activeSubcategory)}</strong>`;
        }
    }
    if (activeSearchQuery.trim() !== "") {
        label += ` matching "<strong>${escapeHTML(activeSearchQuery.trim())}</strong>"`;
    }
    resultsCountText.innerHTML = label;

    // Filter Chips
    activeFilterTags.innerHTML = "";

    if (activeCategory !== "all") {
        const catTag = document.createElement("span");
        catTag.className = "filter-tag";
        catTag.innerHTML = `
            <span>Category: ${escapeHTML(activeCategory)}</span>
            <span class="tag-remove" title="Remove category filter">&times;</span>
        `;
        catTag.querySelector(".tag-remove").addEventListener("click", () => {
            selectCategory("all");
        });
        activeFilterTags.appendChild(catTag);
    }

    if (activeSubcategory !== "all") {
        const subTag = document.createElement("span");
        subTag.className = "filter-tag";
        subTag.innerHTML = `
            <span>Subcategory: ${escapeHTML(activeSubcategory)}</span>
            <span class="tag-remove" title="Remove subcategory filter">&times;</span>
        `;
        subTag.querySelector(".tag-remove").addEventListener("click", () => {
            selectSubcategory("all");
        });
        activeFilterTags.appendChild(subTag);
    }

    if (activeSearchQuery.trim() !== "") {
        const searchTag = document.createElement("span");
        searchTag.className = "filter-tag";
        searchTag.innerHTML = `
            <span>Search: "${escapeHTML(activeSearchQuery.trim())}"</span>
            <span class="tag-remove" title="Clear search">&times;</span>
        `;
        searchTag.querySelector(".tag-remove").addEventListener("click", () => {
            activeSearchQuery = "";
            if (searchInput) searchInput.value = "";
            if (clearSearchBtn) clearSearchBtn.style.display = "none";
            applyFiltersAndRender();
        });
        activeFilterTags.appendChild(searchTag);
    }
}

// =====================================================
// DATE FORMATTING HELPERS
// =====================================================

function formatDate(createdAt) {
    if (!createdAt) return "Date Not Available";
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return "Date Not Available";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function getDateKey(createdAt) {
    if (!createdAt) return "unknown-date";
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return "unknown-date";

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}

// =====================================================
// DISPLAY REQUIREMENTS
// =====================================================

function displayRequirements(list) {
    if (!companyGrid) return;
    companyGrid.innerHTML = "";

    if (list.length === 0) {
        companyGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results-content">
                    <img src="assets/graphics/empty-marketplace.svg" alt="No requirements" class="empty-illustration">
                    <div class="no-results-title">No Requirements Found</div>
                    <p class="no-results-desc">We couldn't find any manufacturing requirements matching your active category or search criteria.</p>
                    <button type="button" class="no-results-btn" id="emptyResetBtn">
                        Clear All Filters
                    </button>
                </div>
            </div>
        `;
        const emptyBtn = document.getElementById("emptyResetBtn");
        if (emptyBtn) emptyBtn.addEventListener("click", resetAllFilters);
        return;
    }

    // Group by Date
    const groupedRequirements = {};
    list.forEach((item) => {
        const dateKey = getDateKey(item.createdAt);
        if (!groupedRequirements[dateKey]) {
            groupedRequirements[dateKey] = [];
        }
        groupedRequirements[dateKey].push(item);
    });

    // Display each Date Group
    Object.keys(groupedRequirements)
        .sort((a, b) => b.localeCompare(a))
        .forEach((dateKey) => {
            const dateRequirements = groupedRequirements[dateKey];

            // Date Bar
            const dateBar = document.createElement("div");
            dateBar.className = "date-bar";
            const displayDate = formatDate(dateRequirements[0].createdAt);
            dateBar.innerHTML = `
                <span class="date-icon">📅</span>
                <span>${escapeHTML(displayDate)}</span>
                <span class="date-count-badge">
                    ${dateRequirements.length} ${dateRequirements.length === 1 ? "Requirement" : "Requirements"}
                </span>
            `;
            companyGrid.appendChild(dateBar);

            // Requirement Cards
            dateRequirements.forEach((item) => {
                const card = document.createElement("div");
                card.className = "company-card";

                const categoryIcon = getCategoryIcon(item.category);
                const subcategoryBadgeHtml = item.subcategory
                    ? `<span class="req-subcategory-badge">${escapeHTML(item.subcategory)}</span>`
                    : "";

                card.innerHTML = `
                    <div class="req-card-top">
                        <div class="req-badges-wrapper">
                            <span class="req-category-badge">
                                ${categoryIcon} ${escapeHTML(item.category || "General")}
                            </span>
                            ${subcategoryBadgeHtml}
                        </div>
                        <span class="req-status-badge">${escapeHTML(item.status || "Pending")}</span>
                    </div>

                    <h2 class="req-title" title="${escapeHTML(item.title)}">
                        ${escapeHTML(item.title)}
                    </h2>

                    <div class="req-company">
                        <span>🏢</span>
                        <strong>${escapeHTML(item.companyName)}</strong>
                    </div>

                    <div class="req-desc-snippet" title="${escapeHTML(item.description)}">
                        ${escapeHTML(item.description)}
                    </div>

                    <div class="req-meta-grid">
                        <div class="req-meta-item">
                            <span class="meta-label">Quantity</span>
                            <span class="meta-val">📦 ${escapeHTML(item.quantity)}</span>
                        </div>
                        <div class="req-meta-item">
                            <span class="meta-label">Budget</span>
                            <span class="meta-val budget-highlight">₹${escapeHTML(item.budget)}</span>
                        </div>
                        <div class="req-meta-item" style="grid-column: 1 / -1;">
                            <span class="meta-label">Deadline</span>
                            <span class="meta-val">⏳ ${escapeHTML(item.deadline)}</span>
                        </div>
                    </div>

                    <div class="req-card-footer">
                        <button class="view-btn">
                            View Details &rarr;
                        </button>
                    </div>
                `;

                // View Details Button Handler
                const viewBtn = card.querySelector(".view-btn");
                viewBtn.addEventListener("click", () => {
                    showDetails(item);
                });

                companyGrid.appendChild(card);
            });
        });
}

// =====================================================
// SHOW REQUIREMENT DETAILS MODAL
// =====================================================

function showDetails(item) {
    selectedRequirement = item;

    if (modalTitle) modalTitle.textContent = item.title;
    if (modalCompany) modalCompany.textContent = item.companyName;
    if (modalCategory) modalCategory.textContent = item.category;

    if (modalCategoryBadge) {
        modalCategoryBadge.textContent = `${getCategoryIcon(item.category)} ${item.category}`;
    }

    if (modalSubcategoryRow && modalSubcategory && modalSubcategoryBadge) {
        if (item.subcategory) {
            modalSubcategory.textContent = item.subcategory;
            modalSubcategoryBadge.textContent = item.subcategory;
            modalSubcategoryBadge.style.display = "inline-block";
            modalSubcategoryRow.style.display = "flex";
        } else {
            modalSubcategoryBadge.style.display = "none";
            modalSubcategoryRow.style.display = "none";
        }
    }

    if (modalDescription) modalDescription.textContent = item.description;
    if (modalQuantity) modalQuantity.textContent = item.quantity;
    if (modalBudget) modalBudget.textContent = item.budget;
    if (modalDeadline) modalDeadline.textContent = item.deadline;

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeRequirementModal() {
    if (modal) {
        modal.style.display = "none";
    }
    selectedRequirement = null;
}

if (closeModal) {
    closeModal.addEventListener("click", closeRequirementModal);
}

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeRequirementModal();
    }
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && modal.style.display === "flex") {
        closeRequirementModal();
    }
});

// Submit Quotation Click Handler
if (quoteBtn) {
    quoteBtn.addEventListener("click", () => {
        if (!selectedRequirement) return;
        window.location.href = `submit_quotation.html?requirementId=${encodeURIComponent(
            selectedRequirement.id
        )}&return=marketplace`;
    });
}

// =====================================================
// SEARCH EVENT HANDLERS
// =====================================================

function handleSearchInput() {
    activeSearchQuery = searchInput ? searchInput.value : "";
    if (clearSearchBtn) {
        clearSearchBtn.style.display = activeSearchQuery.length > 0 ? "inline-block" : "none";
    }
    applyFiltersAndRender();
}

if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearchInput();
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener("click", handleSearchInput);
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        clearSearchBtn.style.display = "none";
        activeSearchQuery = "";
        applyFiltersAndRender();
    });
}

// =====================================================
// ESCAPE HTML HELPER
// =====================================================

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =====================================================
// INITIALIZE
// =====================================================

loadRequirements();