import { openCustomerTrackingModal } from "./manufacturing-tracking.js";
// =====================================================
// FABBRIDGE - RECEIVED QUOTATIONS.JS
// =====================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// =====================================================
// TABLE
// =====================================================

const quotationTable =
    document.getElementById("quotationTable");


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }

        try {

            await loadQuotations(user.uid);

        }

        catch (error) {

            console.error(
                "Quotation page loading error:",
                error
            );

        }

    }
);


// =====================================================
// LOAD RECEIVED QUOTATIONS
// =====================================================

async function loadQuotations(userId) {

    if (!quotationTable) {

        console.error(
            "quotationTable not found."
        );

        return;

    }


    try {

        const quotationQuery =
            query(
                collection(
                    db,
                    "quotations"
                ),

                where(
                    "customerId",
                    "==",
                    userId
                )
            );


        const snapshot =
            await getDocs(
                quotationQuery
            );


        quotationTable.innerHTML =
            "";


        // =================================================
        // NO QUOTATIONS
        // =================================================

        if (snapshot.empty) {

            quotationTable.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:30px;
                        "
                    >

                        No quotations received yet.

                    </td>

                </tr>

            `;

            return;

        }


        // =================================================
        // LOOP QUOTATIONS
        // =================================================

        snapshot.forEach(
            (quotationDoc) => {

                const data =
                    quotationDoc.data();


                // =================================================
                // STATUS
                // =================================================

                const status =
                    data.status ||
                    "Waiting";


                const normalizedStatus =
                    status
                        .toString()
                        .trim()
                        .toLowerCase();


                // =================================================
                // ACTION BUTTONS
                // =================================================

                let actionButtons =
                    "";


                // =================================================
                // WAITING / PENDING
                // =================================================

                if (
                    normalizedStatus === "waiting" ||
                    normalizedStatus === "pending"
                ) {

                    actionButtons = `

                        <button
                            class="accept"
                            onclick="
                                updateQuotationStatus(
                                    '${quotationDoc.id}',
                                    'Accepted'
                                )
                            "
                        >

                            Accept

                        </button>


                        <button
                            class="reject"
                            onclick="
                                updateQuotationStatus(
                                    '${quotationDoc.id}',
                                    'Rejected'
                                )
                            "
                        >

                            Reject

                        </button>


                        <button
                            class="view"
                            onclick="
                                viewCompanyProfile(
                                    '${quotationDoc.id}'
                                )
                            "
                        >

                            View Company

                        </button>

                    `;

                }


                // =================================================
                // ACCEPTED / REJECTED
                else if (normalizedStatus === "accepted") {
                    actionButtons = `
                        <button
                            class="table-track-btn"
                            onclick="
                                openCustomerTrackingModal(
                                    '${quotationDoc.id}'
                                )
                            "
                        >
                            🏭 Track Order
                        </button>

                        <button
                            class="view"
                            onclick="
                                viewCompanyProfile(
                                    '${quotationDoc.id}'
                                )
                            "
                        >
                            View Company
                        </button>
                    `;
                }
                else {
                    actionButtons = `
                        <button
                            class="view"
                            onclick="
                                viewCompanyProfile(
                                    '${quotationDoc.id}'
                                )
                            "
                        >
                            View Company
                        </button>
                    `;
                }


                // =================================================
                // ADD TABLE ROW
                // =================================================

                quotationTable.innerHTML += `

                    <tr>

                        <!-- COMPANY -->

                        <td>

                            ${escapeHTML(
                                data.manufacturerName ||
                                data.companyName ||
                                "Unknown Company"
                            )}

                        </td>


                        <!-- REQUIREMENT -->

                        <td>

                            ${escapeHTML(
                                data.requirementTitle ||
                                "-"
                            )}

                        </td>


                        <!-- PRICE -->

                        <td>

                            ₹${escapeHTML(
                                String(
                                    data.price ||
                                    "0"
                                )
                            )}

                        </td>


                        <!-- DELIVERY -->

                        <td>

                            ${escapeHTML(
                                data.delivery ||
                                "-"
                            )}

                        </td>


                        <!-- STATUS -->

                        <td>
                            <span
                                class="${getStatusClass(
                                    normalizedStatus
                                )}"
                            >
                                ${capitalizeStatus(
                                    normalizedStatus
                                )}
                            </span>
                            ${normalizedStatus === "accepted" ? `
                                <div style="margin-top:6px; font-size:11px; color:#2563eb; font-weight:700;">
                                    Stage: ${escapeHTML(data.manufacturingStage || "Order Confirmed")}
                                </div>
                            ` : ""}
                        </td>


                        <!-- ACTION -->

                        <td class="action-buttons">

                            ${actionButtons}

                        </td>

                    </tr>

                `;

            }
        );

    }

    catch (error) {

        console.error(
            "Error loading quotations:",
            error
        );


        quotationTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    Error loading quotations.

                </td>

            </tr>

        `;

    }

}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    if (
        status === "accepted"
    ) {

        return "accepted";

    }


    if (
        status === "rejected"
    ) {

        return "rejected";

    }


    return "pending";

}


// =====================================================
// STATUS TEXT
// =====================================================

function capitalizeStatus(status) {

    if (!status) {

        return "Waiting";

    }


    return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
    );

}


// =====================================================
// ACCEPT / REJECT QUOTATION
// =====================================================

window.updateQuotationStatus =
async function (
    quotationId,
    newStatus
) {

    try {

        console.log(
            "Updating quotation:",
            quotationId,
            newStatus
        );


        // =================================================
        // CONFIRM ACTION
        // =================================================

        const confirmAction =
            confirm(
                "Are you sure you want to " +
                newStatus.toLowerCase() +
                " this quotation?"
            );


        if (!confirmAction) {

            return;

        }


        // =================================================
        // GET QUOTATION
        // =================================================

        const quotationRef =
            doc(
                db,
                "quotations",
                quotationId
            );


        const quotationSnap =
            await getDoc(
                quotationRef
            );


        if (
            !quotationSnap.exists()
        ) {

            alert(
                "Quotation not found!"
            );

            return;

        }


        const quotationData =
            quotationSnap.data();


        // =================================================
        // REQUIREMENT ID
        // =================================================

        const requirementId =
            quotationData.requirementId;


        if (!requirementId) {

            alert(
                "Requirement ID is missing from this quotation!"
            );

            return;

        }


        // =================================================
        // UPDATE QUOTATION STATUS
        // =================================================

        const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp()
        };

        if (newStatus === "Accepted") {
            updateData.manufacturingStage = "Order Confirmed";
            updateData.manufacturingStagesCompleted = ["Order Confirmed"];
            updateData.manufacturingNotes = "Order confirmed. Manufacturing process initialized.";
            updateData.manufacturingUpdatedAt = serverTimestamp();
            updateData.manufacturingHistory = [
                {
                    stage: "Order Confirmed",
                    note: "Order confirmed by customer.",
                    timestamp: new Date().toISOString()
                }
            ];
        }

        await updateDoc(
            quotationRef,
            updateData
        );


        console.log(
            "Quotation status updated:",
            newStatus
        );


        // =================================================
        // GET REQUIREMENT
        // =================================================

        const requirementRef =
            doc(
                db,
                "requirements",
                requirementId
            );


        const requirementSnap =
            await getDoc(
                requirementRef
            );


        // =================================================
        // UPDATE REQUIREMENT
        // =================================================

        if (
            requirementSnap.exists()
        ) {

            await updateDoc(
                requirementRef,
                {

                    status:
                        newStatus,

                    updatedAt:
                        serverTimestamp()

                }
            );

        }


        // =================================================
        // MANUFACTURER ID
        // =================================================

        const manufacturerId =
            quotationData.manufacturerId;


        // =================================================
        // SEND NOTIFICATION
        // =================================================

        if (manufacturerId) {

            let title =
                "";

            let message =
                "";

            let type =
                "";


            // =================================================
            // ACCEPTED
            // =================================================

            if (
                newStatus === "Accepted"
            ) {

                title =
                    "Quotation Accepted";


                message =
                    "Your quotation for \"" +
                    (
                        quotationData.requirementTitle ||
                        "the requirement"
                    ) +
                    "\" has been accepted.";


                type =
                    "quotation_accepted";

            }


            // =================================================
            // REJECTED
            // =================================================

            else {

                title =
                    "Quotation Rejected";


                message =
                    "Your quotation for \"" +
                    (
                        quotationData.requirementTitle ||
                        "the requirement"
                    ) +
                    "\" has been rejected.";


                type =
                    "quotation_rejected";

            }


            await addDoc(
                collection(
                    db,
                    "notifications"
                ),
                {

                    userId:
                        manufacturerId,

                    quotationId:
                        quotationId,

                    requirementId:
                        requirementId,

                    type:
                        type,

                    title:
                        title,

                    message:
                        message,

                    read:
                        false,

                    createdAt:
                        serverTimestamp()

                }
            );

        }


        // =================================================
        // SUCCESS MESSAGE
        // =================================================

        alert(
            "Quotation " +
            newStatus +
            " successfully!"
        );


        // =================================================
        // RELOAD PAGE
        // =================================================

        await loadQuotations(
            auth.currentUser.uid
        );

    }

    catch (error) {

        console.error(
            "Quotation update error:",
            error
        );


        alert(
            "Update failed:\n\n" +
            error.message
        );

    }

};


// =====================================================
// VIEW COMPANY PROFILE
// =====================================================

window.viewCompanyProfile =
async function (
    quotationId
) {

    try {

        console.log(
            "Opening company profile for:",
            quotationId
        );


        // =================================================
        // GET QUOTATION
        // =================================================

        const quotationRef =
            doc(
                db,
                "quotations",
                quotationId
            );


        const quotationSnap =
            await getDoc(
                quotationRef
            );


        if (
            !quotationSnap.exists()
        ) {

            alert(
                "Quotation not found."
            );

            return;

        }


        const quotationData =
            quotationSnap.data();


        // =================================================
        // GET MANUFACTURER ID
        // =================================================

        const manufacturerId =
            quotationData.manufacturerId;


        if (!manufacturerId) {

            alert(
                "Company profile information is not available."
            );

            return;

        }


        console.log(
            "Company ID:",
            manufacturerId
        );


        // =================================================
        // OPEN COMPANY PROFILE
        // =================================================

        window.location.href =
            "company-profile.html?userId=" +
            encodeURIComponent(
                manufacturerId
            );

    }

    catch (error) {

        console.error(
            "Company profile error:",
            error
        );


        alert(
            "Unable to open company profile."
        );

    }

};


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}