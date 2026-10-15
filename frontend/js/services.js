import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { auth, db } from "./firebase.js";
import { getCategoryImage } from "./categories.js";

// =====================================================
// DOM ELEMENTS
// =====================================================

const addServiceBtn = document.getElementById("addServiceBtn");
const serviceModal = document.getElementById("serviceModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const serviceForm = document.getElementById("serviceForm");
const serviceName = document.getElementById("serviceName");
const serviceCategory = document.getElementById("serviceCategory");
const servicePrice = document.getElementById("servicePrice");
const serviceDescription = document.getElementById("serviceDescription");
const searchInput = document.getElementById("searchInput");
const serviceList = document.getElementById("serviceList");
const dashboardBtn = document.getElementById("dashboardBtn");

// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;
let currentUserData = null;
let isCompanyUser = false;
let allServices = [];
let providersCache = {};
let activeTabFilter = "all"; // 'all' or 'my'

// =====================================================
// AUTHENTICATION & INITIALIZATION
// =====================================================

onAuthStateChanged(auth, async function (user) {
    if (user) {
        currentUser = user;

        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
                currentUserData = userSnap.data();
                const rawRole = (currentUserData.userType || currentUserData.role || "").toString().trim().toLowerCase();
                isCompanyUser = rawRole === "company" || rawRole === "manufacturer" || rawRole === "service provider";
            }
        } catch (e) {
            console.error("Error fetching user profile:", e);
        }

        // Adjust UI according to role
        setupRoleUI();

        // Load services
        await loadServices();

    } else {
        currentUser = null;
        if (serviceList) {
            serviceList.innerHTML = `
                <div class="loading">
                    Please login to view services.
                </div>
            `;
        }
    }
});

// Configure UI based on role
function setupRoleUI() {
    const pageTitle = document.querySelector(".page-header h1");
    const pageDesc = document.querySelector(".page-header p");

    if (isCompanyUser) {
        if (addServiceBtn) addServiceBtn.style.display = "inline-flex";
        if (pageTitle) pageTitle.innerHTML = '<span>🛠️</span> Company Services Showcase';
        if (pageDesc) pageDesc.textContent = "Manage your listed capabilities or explore available platform services.";
    } else {
        if (addServiceBtn) addServiceBtn.style.display = "none";
        if (pageTitle) pageTitle.innerHTML = '<span>🛠️</span> Manufacturing Services Showcase';
        if (pageDesc) pageDesc.textContent = "Discover manufacturing services and contact verified providers directly.";
    }

    const dashboardLink = document.getElementById("dashboardNavLink");
    if (dashboardLink) {
        dashboardLink.href = isCompanyUser ? "dashboard.html" : "customer-dashboard.html";
    }

    // Wire up Dashboard button
    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", () => {
            if (isCompanyUser) {
                window.location.href = "dashboard.html";
            } else {
                window.location.href = "customer-dashboard.html";
            }
        });
    }

    setupTabs();
}

function setupTabs() {
    const tabBar = document.getElementById("servicesTabBar");
    const tabAll = document.getElementById("tabAllServices");
    const tabMy = document.getElementById("tabMyServices");
    if (!tabBar || !tabAll || !tabMy) return;

    if (isCompanyUser) {
        tabBar.style.display = "flex";
    } else {
        tabBar.style.display = "none";
    }

    tabAll.onclick = function () {
        activeTabFilter = "all";
        tabAll.classList.add("active");
        tabMy.classList.remove("active");
        applyCurrentFilters();
    };

    tabMy.onclick = function () {
        activeTabFilter = "my";
        tabMy.classList.add("active");
        tabAll.classList.remove("active");
        applyCurrentFilters();
    };
}

function applyCurrentFilters() {
    const searchText = (searchInput ? searchInput.value : "").toLowerCase().trim();
    let filtered = allServices;

    if (isCompanyUser && activeTabFilter === "my") {
        filtered = filtered.filter(s => s.userId === (currentUser ? currentUser.uid : ""));
    }

    if (searchText !== "") {
        filtered = filtered.filter(function (service) {
            const name = String(service.serviceName || "").toLowerCase();
            const category = String(service.category || "").toLowerCase();
            const description = String(service.description || "").toLowerCase();
            const company = String(service.companyName || "").toLowerCase();

            return (
                name.includes(searchText) ||
                category.includes(searchText) ||
                description.includes(searchText) ||
                company.includes(searchText)
            );
        });
    }

    displayServices(filtered);
}

// =====================================================
// MODAL CONTROLS (ADD SERVICE)
// =====================================================

if (addServiceBtn) {
    addServiceBtn.addEventListener("click", function () {
        if (!currentUser) {
            alert("Please login first.");
            return;
        }
        serviceModal.classList.add("show");
    });
}

function closeModal() {
    if (!serviceModal) return;
    serviceModal.classList.remove("show");
    if (serviceForm) serviceForm.reset();
}

if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

if (serviceModal) {
    serviceModal.addEventListener("click", function (event) {
        if (event.target === serviceModal) {
            closeModal();
        }
    });
}

// =====================================================
// FORM SUBMIT (ADD SERVICE)
// =====================================================

if (serviceForm) {
    serviceForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!currentUser) {
            alert("Please login first.");
            return;
        }

        const name = serviceName.value.trim();
        const category = serviceCategory.value.trim();
        const price = servicePrice.value.trim();
        const description = serviceDescription.value.trim();

        if (name === "" || category === "" || price === "" || description === "") {
            alert("Please fill all fields.");
            return;
        }

        try {
            const serviceData = {
                serviceName: name,
                category: category,
                price: Number(price),
                description: description,
                userId: currentUser.uid,
                ownerEmail: currentUser.email || "",
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "services"), serviceData);

            alert("Service added successfully!");
            closeModal();
            await loadServices();

        } catch (error) {
            console.error("FIRESTORE SAVE ERROR:", error);
            alert("Service could not be saved.\n\n" + error.message);
        }
    });
}

// =====================================================
// FETCH PROVIDER DATA (CACHED)
// =====================================================

async function getProviderData(providerUid) {
    if (!providerUid) return null;
    if (providersCache[providerUid]) return providersCache[providerUid];

    try {
        const uDoc = await getDoc(doc(db, "users", providerUid));
        if (uDoc.exists()) {
            providersCache[providerUid] = uDoc.data();
            return providersCache[providerUid];
        }
    } catch (e) {
        console.error("Error loading provider user:", e);
    }
    return null;
}

// =====================================================
// LOAD SERVICES
// =====================================================

async function loadServices() {
    if (!currentUser || !serviceList) return;

    serviceList.innerHTML = `
        <div class="loading">
            Loading services...
        </div>
    `;

    try {
        // Load all available services so users can browse the showcase
        const snapshot = await getDocs(collection(db, "services"));
        allServices = [];

        for (const serviceDoc of snapshot.docs) {
            const data = serviceDoc.data();
            const serviceObj = {
                id: serviceDoc.id,
                ...data
            };

            // Retrieve actual company name from provider user profile
            const providerInfo = await getProviderData(data.userId);
            if (providerInfo) {
                serviceObj.companyName = providerInfo.companyName || providerInfo.company || providerInfo.businessName || providerInfo.name || "Manufacturing Provider";
                serviceObj.ownerName = providerInfo.ownerName || providerInfo.name || providerInfo.fullName || "Contact Person";
                serviceObj.phone = providerInfo.phone || providerInfo.mobile || providerInfo.contactNumber || "";
                serviceObj.email = providerInfo.email || data.ownerEmail || "";
                serviceObj.location = providerInfo.location || providerInfo.city || providerInfo.address || "";
                serviceObj.verified = providerInfo.verified === true;
            } else {
                serviceObj.companyName = data.ownerEmail ? data.ownerEmail.split("@")[0] : "Service Provider";
                serviceObj.ownerName = "Provider Contact";
                serviceObj.phone = "";
                serviceObj.email = data.ownerEmail || "";
                serviceObj.location = "";
                serviceObj.verified = false;
            }

            allServices.push(serviceObj);
        }

        // Apply Tab and Search Filter
        applyCurrentFilters();

    } catch (error) {
        console.error("LOAD SERVICES ERROR:", error);
        serviceList.innerHTML = `
            <div class="loading">
                Error loading services.
                <br><br>
                ${escapeHTML(error.message)}
            </div>
        `;
    }
}

// =====================================================
// DISPLAY SERVICES
// =====================================================

function displayServices(services) {
    if (!serviceList) return;

    if (services.length === 0) {
        serviceList.innerHTML = `
            <div class="empty-services-state" style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: white; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <div style="font-size: 38px; margin-bottom: 12px;">🛠️</div>
                <h3 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">No Services Found</h3>
                <p style="color: #64748b; font-size: 15px; max-width: 480px; margin: 0 auto 20px auto;">
                    ${isCompanyUser && activeTabFilter === 'my' ? 'You have not listed any manufacturing services yet. Click "+ Add Service" to showcase your capabilities to buyers.' : 'No services currently match your search criteria. Try a different keyword or category.'}
                </p>
                ${isCompanyUser && activeTabFilter === 'my' ? `<button onclick="document.getElementById('addServiceBtn')?.click()" class="add-btn" style="display: inline-block;">+ Add Your First Service</button>` : ''}
            </div>
        `;
        return;
    }

    serviceList.innerHTML = "";

    services.forEach(function (service) {
        const card = document.createElement("div");
        card.className = "service-card";

        const isOwner = currentUser && service.userId === currentUser.uid;
        const catImage = getCategoryImage(service.category);

        card.innerHTML = `
            <div class="service-card-top">
                <div class="service-thumb-box">
                    <img src="${catImage}" alt="${escapeHTML(service.category || 'Service')}" class="service-thumb-img" loading="lazy">
                </div>
                <span class="service-category">
                    ${escapeHTML(service.category || "General")}
                </span>
            </div>

            <div class="service-card-body">
                <h3 class="service-card-title">${escapeHTML(service.serviceName || "Service")}</h3>

                <div class="service-company-tag">
                    <span style="font-size: 15px;">🏢</span>
                    <strong>${escapeHTML(service.companyName || "Verified Company")}</strong>
                    ${service.verified ? '<span class="verified-tag">✓ Verified</span>' : ''}
                </div>

                <div class="service-price">
                    <span style="font-size: 12px; color: #64748b; font-weight: normal; margin-right: 4px;">Starting from:</span>
                    ₹${Number(service.price || 0).toLocaleString('en-IN')}
                </div>

                <p class="service-description">
                    ${escapeHTML(service.description || "No description provided.")}
                </p>
            </div>

            <div class="service-card-actions">
                <button
                    class="contact-btn"
                    onclick="window.openContactModal('${service.id}')"
                    style="flex: 1;"
                >
                    📞 Contact
                </button>

                ${isOwner ? `
                    <button
                        class="delete-service-btn"
                        data-id="${service.id}"
                    >
                        🗑 Delete
                    </button>
                ` : ""}
            </div>
        `;

        serviceList.appendChild(card);
    });

    // Wire up delete buttons
    const deleteButtons = document.querySelectorAll(".delete-service-btn");
    deleteButtons.forEach(function (button) {
        button.addEventListener("click", async function () {
            const serviceId = button.dataset.id;
            await deleteService(serviceId);
        });
    });
}

// =====================================================
// DELETE SERVICE
// =====================================================

async function deleteService(serviceId) {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const confirmation = confirm("Are you sure you want to delete this service?");
    if (!confirmation) return;

    try {
        await deleteDoc(doc(db, "services", serviceId));
        alert("Service deleted successfully.");
        await loadServices();
    } catch (error) {
        console.error("DELETE ERROR:", error);
        alert("Unable to delete service: " + error.message);
    }
}

// =====================================================
// CONTACT DETAILS MODAL (CONNECTED TO ACTUAL PROVIDER)
// =====================================================

window.openContactModal = async function (serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (!service) {
        alert("Service information not found.");
        return;
    }

    // Close any existing modal
    closeContactModal();

    // Fetch latest real provider data
    let provider = await getProviderData(service.userId);
    if (!provider) {
        provider = {
            companyName: service.companyName,
            ownerName: service.ownerName,
            phone: service.phone,
            email: service.email,
            location: service.location
        };
    }

    const companyName = provider.companyName || provider.company || provider.businessName || provider.name || "Service Provider";
    const contactPerson = provider.ownerName || provider.name || provider.fullName || "Company Representative";
    const phone = provider.phone || provider.mobile || provider.contactNumber || "";
    const email = provider.email || service.ownerEmail || "";
    const location = provider.location || provider.city || provider.address || "";
    const isVerified = provider.verified === true;

    const modalBackdrop = document.createElement("div");
    modalBackdrop.id = "contactProviderModalOverlay";
    modalBackdrop.className = "contact-modal-backdrop";

    modalBackdrop.innerHTML = `
        <div class="contact-modal-box">
            <div class="contact-modal-header">
                <div>
                    <h3>📞 Contact Service Provider</h3>
                    <p style="font-size: 13px; color: #64748b; margin-top: 4px;">
                        Connect directly with this verified manufacturing provider.
                    </p>
                </div>
                <button class="modal-close-btn" onclick="window.closeContactModal()">&times;</button>
            </div>

            <!-- Inquired Service Tag -->
            <div class="contact-modal-service-badge">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #2563eb; letter-spacing: 0.5px; margin-bottom: 2px;">
                    Inquiring About:
                </div>
                <div style="font-size: 15px; font-weight: 700; color: #0f172a;">
                    🛠️ ${escapeHTML(service.serviceName || "Service")}
                </div>
                <div style="font-size: 12.5px; color: #64748b; margin-top: 2px;">
                    Category: <strong>${escapeHTML(service.category || "General")}</strong> &bull; Starting from: <strong style="color: #059669;">₹${escapeHTML(String(service.price || 0))}</strong>
                </div>
            </div>

            <!-- Provider Profile Details -->
            <div style="margin-bottom: 16px;">
                <div style="font-size: 18px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                    🏢 ${escapeHTML(companyName)}
                    ${isVerified ? '<span style="background:#ecfdf5; color:#059669; font-size:11px; font-weight:700; padding:3px 8px; border-radius:12px; border:1px solid #a7f3d0;">✓ Verified</span>' : ''}
                </div>
                <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                    👤 Contact Person: <strong>${escapeHTML(contactPerson)}</strong>
                </div>
            </div>

            <!-- Real Contact Details List -->
            <div class="contact-info-list">
                <!-- Phone -->
                <div class="contact-info-item">
                    <span class="item-icon">📱</span>
                    <div class="item-content">
                        <div class="item-label">Phone Number</div>
                        <div>
                            ${phone ? `
                                <a href="tel:${escapeHTML(phone)}" class="contact-action-link" style="font-size: 15px; font-weight: 700;">
                                    ${escapeHTML(phone)}
                                </a>
                            ` : `
                                <span class="contact-not-provided">Contact details are not available yet.</span>
                            `}
                        </div>
                    </div>
                    ${phone ? `
                        <a href="tel:${escapeHTML(phone)}" class="contact-btn" style="padding: 7px 12px !important; font-size: 12px !important; text-decoration: none;">
                            Call Now
                        </a>
                    ` : ""}
                </div>

                <!-- Email -->
                <div class="contact-info-item">
                    <span class="item-icon">✉️</span>
                    <div class="item-content">
                        <div class="item-label">Email Address</div>
                        <div>
                            ${email ? `
                                <a href="mailto:${escapeHTML(email)}?subject=Inquiry regarding ${encodeURIComponent(service.serviceName || 'Service')}" class="contact-action-link" style="font-size: 14px;">
                                    ${escapeHTML(email)}
                                </a>
                            ` : `
                                <span class="contact-not-provided">Contact details are not available yet.</span>
                            `}
                        </div>
                    </div>
                    ${email ? `
                        <a href="mailto:${escapeHTML(email)}?subject=Inquiry regarding ${encodeURIComponent(service.serviceName || 'Service')}" class="contact-btn" style="padding: 7px 12px !important; font-size: 12px !important; text-decoration: none; background: #334155 !important;">
                            Send Email
                        </a>
                    ` : ""}
                </div>

                <!-- Location -->
                <div class="contact-info-item">
                    <span class="item-icon">📍</span>
                    <div class="item-content">
                        <div class="item-label">Location / Address</div>
                        <div>
                            ${location ? `
                                <span>${escapeHTML(location)}</span>
                            ` : `
                                <span class="contact-not-provided">Location details not specified.</span>
                            `}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer / Company Profile Link -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
                ${service.userId ? `
                    <a
                        href="company-profile.html?userId=${encodeURIComponent(service.userId)}"
                        style="color: #2563eb; font-size: 13.5px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 5px;"
                    >
                        🏢 View Full Company Profile &rarr;
                    </a>
                ` : '<div></div>'}

                <button class="modal-btn-secondary" onclick="window.closeContactModal()" style="padding: 8px 18px; border-radius: 8px; font-size: 13px;">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modalBackdrop);

    modalBackdrop.addEventListener("click", function (e) {
        if (e.target === modalBackdrop) closeContactModal();
    });
};

window.closeContactModal = function () {
    const existing = document.getElementById("contactProviderModalOverlay");
    if (existing) existing.remove();
};

// =====================================================
// SEARCH FUNCTIONALITY
// =====================================================

if (searchInput) {
    searchInput.addEventListener("input", applyCurrentFilters);
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