// =====================================================
// FABBRIDGE - MANUFACTURING PROCESS TRACKING MODULE
// =====================================================

import { auth, db } from "./firebase.js";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp,
    onSnapshot,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// =====================================================
// 8 MANUFACTURING STAGES IN EXACT ORDER
// =====================================================
export const MANUFACTURING_STAGES = [
    "Order Confirmed",
    "Design/Drawing Review",
    "Raw Material Preparation",
    "Machining/Manufacturing",
    "Quality Inspection",
    "Packing",
    "Ready for Delivery",
    "Delivered"
];

// Stage Icons
export const STAGE_ICONS = {
    "Order Confirmed": "📋",
    "Design/Drawing Review": "📐",
    "Raw Material Preparation": "🧱",
    "Machining/Manufacturing": "⚙️",
    "Quality Inspection": "🔍",
    "Packing": "📦",
    "Ready for Delivery": "🚚",
    "Delivered": "✅"
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getStageIndex(stageName) {
    if (!stageName) return 0;
    const clean = String(stageName).trim().toLowerCase();
    const idx = MANUFACTURING_STAGES.findIndex(
        s => s.toLowerCase() === clean
    );
    return idx >= 0 ? idx : 0;
}

export function getStageProgressPercent(stageName) {
    const idx = getStageIndex(stageName);
    const pct = ((idx + 1) / MANUFACTURING_STAGES.length) * 100;
    return pct;
}

export function formatProgressPercent(stageName) {
    const pct = getStageProgressPercent(stageName);
    return (pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)) + "%";
}

export function getStageBadgeClass(stageName) {
    const idx = getStageIndex(stageName);
    if (idx === 0) return "status-confirmed";
    if (idx < 6) return "status-in-progress";
    if (idx === 6) return "status-ready";
    return "status-delivered";
}

export function formatTimestamp(ts) {
    if (!ts) return "Just now";
    try {
        let date;
        if (typeof ts.toDate === "function") {
            date = ts.toDate();
        } else if (ts instanceof Date) {
            date = ts;
        } else if (typeof ts === "string" || typeof ts === "number") {
            date = new Date(ts);
        } else if (ts.seconds) {
            date = new Date(ts.seconds * 1000);
        } else {
            return "Recently";
        }

        if (isNaN(date.getTime())) return "Recently";

        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    } catch (e) {
        return "Recently";
    }
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =====================================================
// RENDER STEPPER HTML
// =====================================================
export function renderStepperHTML(currentStageName) {
    const currentIdx = getStageIndex(currentStageName);
    const isFullyDelivered = currentIdx === 7;

    let stepsHTML = "";

    MANUFACTURING_STAGES.forEach((stage, idx) => {
        let stateClass = "is-upcoming";
        let statusTag = "Upcoming";
        let iconOrNum = idx + 1;

        if (idx < currentIdx || (isFullyDelivered && idx === currentIdx)) {
            stateClass = "is-completed";
            statusTag = "Completed";
            iconOrNum = "✓";
        } else if (idx === currentIdx) {
            stateClass = "is-current";
            statusTag = "Current";
            iconOrNum = idx + 1;
        }

        stepsHTML += `
            <div class="step-item ${stateClass}" title="${stage}">
                <div class="step-circle">${iconOrNum}</div>
                <div class="step-label">
                    ${escapeHTML(stage)}
                    <span class="step-status-tag">${statusTag}</span>
                </div>
            </div>
        `;
    });

    return `
        <div class="stepper-container">
            ${stepsHTML}
        </div>
    `;
}

// =====================================================
// RENDER TRACKING CARD (CUSTOMER OR COMPANY)
// =====================================================
export function renderTrackingCard(order, options = {}) {
    const { isCompany = false, onUpdateClick = "" } = options;
    const currentStage = order.manufacturingStage || "Order Confirmed";
    const currentIdx = getStageIndex(currentStage);
    const percentText = formatProgressPercent(currentStage);
    const percentValue = getStageProgressPercent(currentStage);
    const badgeClass = getStageBadgeClass(currentStage);
    const isCompleted = currentIdx === 7;

    const orderTitle = order.requirementTitle || order.title || "Manufacturing Order";
    const partyLabel = isCompany ? "Customer" : "Company";
    const partyName = isCompany 
        ? (order.customerName || order.buyerName || "Customer") 
        : (order.manufacturerName || order.companyName || "Manufacturer");
    const price = order.price ? `₹${order.price}` : "Price not specified";
    const delivery = order.delivery || order.deliveryTime || "Standard";
    const noteText = order.manufacturingNotes || "No progress note added yet.";
    const updatedTime = formatTimestamp(order.manufacturingUpdatedAt || order.updatedAt || order.createdAt);

    return `
        <div class="tracking-card" id="tracking-card-${order.id}">
            <!-- Header -->
            <div class="tracking-card-header">
                <div class="tracking-title-box">
                    <h3>📦 ${escapeHTML(orderTitle)}</h3>
                    <div class="tracking-meta">
                        <span class="tracking-meta-item">
                            👤 <strong>${partyLabel}:</strong> ${escapeHTML(partyName)}
                        </span>
                        <span class="tracking-meta-item">
                            💰 <strong>Quote:</strong> ${escapeHTML(price)}
                        </span>
                        <span class="tracking-meta-item">
                            🚚 <strong>Delivery:</strong> ${escapeHTML(delivery)}
                        </span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="stage-pill ${badgeClass}">
                        ${STAGE_ICONS[currentStage] || "⚙️"} ${escapeHTML(currentStage)}
                    </span>
                    ${isCompany ? `
                        <button class="update-stage-btn" onclick="openManufacturingUpdateModal('${order.id}')">
                            ⚙️ Update Stage
                        </button>
                    ` : ""}
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar-wrapper">
                <div class="progress-bar-header">
                    <span class="progress-bar-title">Stage ${currentIdx + 1} of 8: ${escapeHTML(currentStage)}</span>
                    <span class="progress-bar-percent">${percentText} Completed</span>
                </div>
                <div class="progress-bar-track">
                    <div class="progress-bar-fill ${isCompleted ? 'completed' : ''}" style="width: ${percentValue}%;"></div>
                </div>
            </div>

            <!-- Stepper -->
            ${renderStepperHTML(currentStage)}

            <!-- Note & Timestamp Box -->
            <div class="tracking-info-box">
                <div class="tracking-note-box">
                    <div class="tracking-note-label">📝 Latest Progress Note:</div>
                    <div class="tracking-note-text">"${escapeHTML(noteText)}"</div>
                </div>
                <div class="tracking-time-box">
                    🕒 <strong>Last Updated:</strong> ${escapeHTML(updatedTime)}
                </div>
            </div>
        </div>
    `;
}

// =====================================================
// CUSTOMER SIDE - LOAD TRACKING ORDERS
// =====================================================
export function loadCustomerManufacturingOrders(customerId, containerElement) {
    if (!containerElement) {
        containerElement = document.getElementById("customerTrackingContainer");
    }
    if (!containerElement) return;

    try {
        const q = query(
            collection(db, "quotations"),
            where("customerId", "==", customerId)
        );

        // Real-time listener for customer
        return onSnapshot(q, (snapshot) => {
            const confirmedOrders = [];

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const status = (data.status || "").toString().trim().toLowerCase();
                if (status === "accepted") {
                    confirmedOrders.push({
                        id: docSnap.id,
                        ...data
                    });
                }
            });

            if (confirmedOrders.length === 0) {
                containerElement.innerHTML = `
                    <div class="tracking-empty">
                        <img src="assets/graphics/empty-tracking.svg" alt="No active orders" style="width: 130px; height: 98px; margin-bottom: 12px; object-fit: contain;">
                        <h3>No Active Manufacturing Orders</h3>
                        <p>Once you accept a quotation, its real-time 8-stage manufacturing progress will appear here.</p>
                    </div>
                `;
                return;
            }

            // Sort orders: most recent update first
            confirmedOrders.sort((a, b) => {
                const tA = (a.manufacturingUpdatedAt && a.manufacturingUpdatedAt.seconds) || (a.updatedAt && a.updatedAt.seconds) || 0;
                const tB = (b.manufacturingUpdatedAt && b.manufacturingUpdatedAt.seconds) || (b.updatedAt && b.updatedAt.seconds) || 0;
                return tB - tA;
            });

            let html = "";
            confirmedOrders.forEach(order => {
                html += renderTrackingCard(order, { isCompany: false });
            });
            containerElement.innerHTML = html;
        }, (error) => {
            console.error("Error listening to customer manufacturing orders:", error);
            containerElement.innerHTML = `
                <div class="tracking-empty">
                    <p>Unable to load manufacturing tracking at this time.</p>
                </div>
            `;
        });
    } catch (err) {
        console.error("Failed to load customer manufacturing tracking:", err);
    }
}

// =====================================================
// COMPANY SIDE - LOAD CONFIRMED ORDERS
// =====================================================
export async function loadCompanyManufacturingOrders(companyId, containerElement) {
    if (!containerElement) {
        containerElement = document.getElementById("companyManufacturingContainer");
    }
    if (!containerElement) return;

    try {
        const snapshot = await getDocs(collection(db, "quotations"));
        const confirmedOrders = [];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const mId = data.manufacturerId || data.companyId || data.submittedBy || data.createdBy || "";
            const status = (data.status || "").toString().trim().toLowerCase();

            if (mId === companyId && status === "accepted") {
                confirmedOrders.push({
                    id: docSnap.id,
                    ...data
                });
            }
        });

        if (confirmedOrders.length === 0) {
            containerElement.innerHTML = `
                <div class="tracking-empty">
                    <img src="assets/graphics/empty-tracking.svg" alt="No confirmed orders" style="width: 130px; height: 98px; margin-bottom: 12px; object-fit: contain;">
                    <h3>No Confirmed Orders Yet</h3>
                    <p>When customers accept your submitted quotations, orders will appear here for manufacturing tracking.</p>
                </div>
            `;
            return;
        }

        // Sort orders: most recent update first
        confirmedOrders.sort((a, b) => {
            const tA = (a.manufacturingUpdatedAt && a.manufacturingUpdatedAt.seconds) || (a.updatedAt && a.updatedAt.seconds) || 0;
            const tB = (b.manufacturingUpdatedAt && b.manufacturingUpdatedAt.seconds) || (b.updatedAt && b.updatedAt.seconds) || 0;
            return tB - tA;
        });

        let html = "";
        confirmedOrders.forEach(order => {
            html += renderTrackingCard(order, { isCompany: true });
        });
        containerElement.innerHTML = html;
    } catch (err) {
        console.error("Failed to load company manufacturing tracking:", err);
        containerElement.innerHTML = `
            <div class="tracking-empty">
                <p>Unable to load confirmed orders at this time.</p>
            </div>
        `;
    }
}

// =====================================================
// COMPANY SIDE - UPDATE MANUFACTURING MODAL
// =====================================================
export async function openCompanyTrackingModal(quotationId) {
    if (!quotationId) return;

    try {
        const quotationRef = doc(db, "quotations", quotationId);
        const snap = await getDoc(quotationRef);

        if (!snap.exists()) {
            alert("Quotation order not found!");
            return;
        }

        const data = snap.data();
        const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
        const manufacturerId = data.manufacturerId || data.companyId || data.submittedBy || data.createdBy || "";

        // Permission check
        if (currentUserId && manufacturerId && currentUserId !== manufacturerId) {
            alert("Unauthorized: Only the company that submitted this quotation can update its progress.");
            return;
        }

        const currentStage = data.manufacturingStage || "Order Confirmed";
        const currentIdx = getStageIndex(currentStage);
        const isFullyDelivered = currentIdx === 7;
        const orderTitle = data.requirementTitle || "Manufacturing Order";
        const customerName = data.customerName || data.buyerName || "Customer";
        const price = data.price ? `₹${data.price}` : "N/A";
        const delivery = data.delivery || "Standard";

        // Build stage select options: completed & current stages are disabled to prevent accidental backward moves
        let optionsHTML = "";
        MANUFACTURING_STAGES.forEach((stage, idx) => {
            if (idx < currentIdx) {
                optionsHTML += `<option value="${stage}" disabled>✓ ${stage} (Completed)</option>`;
            } else if (idx === currentIdx) {
                optionsHTML += `<option value="${stage}" disabled selected>● ${stage} (Current Stage)</option>`;
            } else {
                const isNext = idx === currentIdx + 1;
                optionsHTML += `<option value="${stage}" ${isNext ? "selected" : ""}>→ ${stage} ${isNext ? "(Next Stage)" : ""}</option>`;
            }
        });

        // Close any existing modal
        closeModal();

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "manufacturingModalOverlay";
        modalOverlay.className = "manufacturing-modal-backdrop";

        modalOverlay.innerHTML = `
            <div class="manufacturing-modal-content">
                <div class="modal-header">
                    <div>
                        <h3>⚙️ Update Manufacturing Progress</h3>
                        <p>Order: <strong>${escapeHTML(orderTitle)}</strong></p>
                    </div>
                    <button class="modal-close-btn" onclick="window.closeManufacturingModal()">&times;</button>
                </div>

                <div class="modal-order-summary">
                    <div><strong>Customer:</strong> ${escapeHTML(customerName)}</div>
                    <div><strong>Quote Price:</strong> ${escapeHTML(price)}</div>
                    <div><strong>Delivery:</strong> ${escapeHTML(delivery)}</div>
                    <div><strong>Current Stage:</strong> <span class="stage-pill ${getStageBadgeClass(currentStage)}">${STAGE_ICONS[currentStage] || ""} ${escapeHTML(currentStage)}</span></div>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="font-size:13px; font-weight:600; color:#334155; margin-bottom:8px;">Manufacturing Workflow:</div>
                    ${renderStepperHTML(currentStage)}
                </div>

                ${isFullyDelivered ? `
                    <div style="background:#dcfce7; color:#166534; padding:16px; border-radius:10px; font-size:14px; text-align:center; font-weight:600; margin-bottom:15px;">
                        ✅ Order has been Delivered! All manufacturing stages are fully complete.
                    </div>
                ` : `
                    <div class="modal-form-group">
                        <label for="modalStageSelect">Move Order to Next Stage:</label>
                        <select id="modalStageSelect" class="modal-select">
                            ${optionsHTML}
                        </select>
                    </div>

                    <div class="modal-form-group">
                        <label for="modalProgressNote">Progress Note (Optional):</label>
                        <textarea id="modalProgressNote" class="modal-textarea" rows="3" placeholder="Enter production details or notes (e.g., Raw material arrived, machining in progress)...">${escapeHTML(data.manufacturingNotes || "")}</textarea>
                    </div>
                `}

                <div class="modal-actions">
                    <button class="modal-btn-secondary" onclick="window.closeManufacturingModal()">Close</button>
                    ${!isFullyDelivered ? `
                        <button id="modalSubmitBtn" class="modal-btn-primary" onclick="window.submitManufacturingStageUpdate('${quotationId}')">
                            ✓ Update Stage
                        </button>
                    ` : ""}
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        // Close on background click
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeModal();
        });

    } catch (error) {
        console.error("Error opening manufacturing update modal:", error);
        alert("Failed to load order tracking details.");
    }
}

// =====================================================
// COMPANY SIDE - SUBMIT STAGE UPDATE
// =====================================================
export async function submitManufacturingStageUpdate(quotationId) {
    const stageSelect = document.getElementById("modalStageSelect");
    const noteInput = document.getElementById("modalProgressNote");
    const submitBtn = document.getElementById("modalSubmitBtn");

    if (!stageSelect) return;

    const newStage = stageSelect.value;
    const progressNote = noteInput ? noteInput.value.trim() : "";

    const newIdx = getStageIndex(newStage);

    try {
        const quotationRef = doc(db, "quotations", quotationId);
        const snap = await getDoc(quotationRef);

        if (!snap.exists()) {
            alert("Quotation not found!");
            return;
        }

        const data = snap.data();
        const currentStage = data.manufacturingStage || "Order Confirmed";
        const currentIdx = getStageIndex(currentStage);

        // Validation: forbid backward stage changes
        if (newIdx <= currentIdx) {
            alert("Invalid stage selection. Please select a forward manufacturing stage.");
            return;
        }

        // Confirmation dialog
        const confirmed = confirm(
            `Advance manufacturing progress from "${currentStage}" to "${newStage}"?`
        );
        if (!confirmed) return;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Updating...";
        }

        // Build list of completed stages up to newStage
        const completedStages = MANUFACTURING_STAGES.slice(0, newIdx + 1);

        // 1. Update quotation document
        await updateDoc(quotationRef, {
            manufacturingStage: newStage,
            manufacturingStagesCompleted: completedStages,
            manufacturingNotes: progressNote || `Advanced to ${newStage}`,
            manufacturingUpdatedAt: serverTimestamp(),
            manufacturingHistory: arrayUnion({
                stage: newStage,
                note: progressNote || "",
                timestamp: new Date().toISOString()
            })
        });

        // 2. Create customer notification
        if (data.customerId) {
            const orderTitle = data.requirementTitle || "Manufacturing Order";
            await addDoc(collection(db, "notifications"), {
                userId: data.customerId,
                quotationId: quotationId,
                requirementId: data.requirementId || "",
                type: "manufacturing_update",
                title: `Manufacturing Update: ${newStage}`,
                message: `Your order "${orderTitle}" has moved to stage: ${newStage}.${progressNote ? ` Note: "${progressNote}"` : ""}`,
                read: false,
                createdAt: serverTimestamp()
            });
        }

        alert(`Manufacturing stage successfully updated to "${newStage}"!`);
        closeModal();

        // Refresh UI if functions exist
        if (typeof window.refreshDashboardManufacturing === "function") {
            window.refreshDashboardManufacturing();
        } else if (typeof window.loadSubmittedQuotations === "function" && auth.currentUser) {
            window.loadSubmittedQuotations(auth.currentUser.uid);
        } else {
            // Reload page if needed
            window.location.reload();
        }

    } catch (err) {
        console.error("Error updating manufacturing stage:", err);
        alert(`Failed to update manufacturing stage:\n\n${err.message}`);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "✓ Update Stage";
        }
    }
}

// =====================================================
// CUSTOMER SIDE - VIEW TRACKING MODAL (FROM TABLE)
// =====================================================
export async function openCustomerTrackingModal(quotationId) {
    if (!quotationId) return;

    try {
        const quotationRef = doc(db, "quotations", quotationId);
        const snap = await getDoc(quotationRef);

        if (!snap.exists()) {
            alert("Order not found!");
            return;
        }

        const data = snap.data();
        const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

        if (currentUserId && data.customerId && data.customerId !== currentUserId) {
            alert("Unauthorized: You can only view tracking for your own orders.");
            return;
        }

        const currentStage = data.manufacturingStage || "Order Confirmed";
        const currentIdx = getStageIndex(currentStage);
        const percentText = formatProgressPercent(currentStage);
        const percentValue = getStageProgressPercent(currentStage);
        const orderTitle = data.requirementTitle || "Manufacturing Order";
        const companyName = data.manufacturerName || data.companyName || "Manufacturer";
        const price = data.price ? `₹${data.price}` : "N/A";
        const delivery = data.delivery || "Standard";
        const noteText = data.manufacturingNotes || "No progress note added yet.";
        const updatedTime = formatTimestamp(data.manufacturingUpdatedAt || data.updatedAt || data.createdAt);

        closeModal();

        const modalOverlay = document.createElement("div");
        modalOverlay.id = "manufacturingModalOverlay";
        modalOverlay.className = "manufacturing-modal-backdrop";

        modalOverlay.innerHTML = `
            <div class="manufacturing-modal-content">
                <div class="modal-header">
                    <div>
                        <h3>🏭 Manufacturing Progress Tracker</h3>
                        <p>Order: <strong>${escapeHTML(orderTitle)}</strong></p>
                    </div>
                    <button class="modal-close-btn" onclick="window.closeManufacturingModal()">&times;</button>
                </div>

                <div class="modal-order-summary">
                    <div><strong>Company:</strong> ${escapeHTML(companyName)}</div>
                    <div><strong>Quote Price:</strong> ${escapeHTML(price)}</div>
                    <div><strong>Delivery:</strong> ${escapeHTML(delivery)}</div>
                    <div><strong>Current Stage:</strong> <span class="stage-pill ${getStageBadgeClass(currentStage)}">${STAGE_ICONS[currentStage] || ""} ${escapeHTML(currentStage)}</span></div>
                </div>

                <!-- Progress Bar -->
                <div class="progress-bar-wrapper">
                    <div class="progress-bar-header">
                        <span class="progress-bar-title">Stage ${currentIdx + 1} of 8: ${escapeHTML(currentStage)}</span>
                        <span class="progress-bar-percent">${percentText} Completed</span>
                    </div>
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill ${currentIdx === 7 ? 'completed' : ''}" style="width: ${percentValue}%;"></div>
                    </div>
                </div>

                <!-- Stepper -->
                <div style="margin-bottom: 20px;">
                    ${renderStepperHTML(currentStage)}
                </div>

                <!-- Note & Timestamp Box -->
                <div class="tracking-info-box" style="margin-bottom: 20px;">
                    <div class="tracking-note-box">
                        <div class="tracking-note-label">📝 Latest Progress Note:</div>
                        <div class="tracking-note-text">"${escapeHTML(noteText)}"</div>
                    </div>
                    <div class="tracking-time-box">
                        🕒 <strong>Last Updated:</strong> ${escapeHTML(updatedTime)}
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn-primary" onclick="window.closeManufacturingModal()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeModal();
        });

    } catch (error) {
        console.error("Error opening customer tracking modal:", error);
        alert("Failed to load order tracking details.");
    }
}

// Close Modal Helper
export function closeModal() {
    const existing = document.getElementById("manufacturingModalOverlay");
    if (existing) {
        existing.remove();
    }
}

// Attach globally to window for HTML button onclick handlers
window.openManufacturingUpdateModal = openCompanyTrackingModal;
window.submitManufacturingStageUpdate = submitManufacturingStageUpdate;
window.openCustomerTrackingModal = openCustomerTrackingModal;
window.closeManufacturingModal = closeModal;
