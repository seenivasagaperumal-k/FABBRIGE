import { openCompanyTrackingModal } from "./manufacturing-tracking.js";
// ======================================================
// FABBRIDGE - SUBMITTED QUOTATIONS
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ======================================================
// HTML
// ======================================================

const quotationTable =
    document.getElementById(
        "quotationTable"
    );


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        await loadSubmittedQuotations(
            user.uid
        );

    }
);


// ======================================================
// LOAD SUBMITTED QUOTATIONS
// ======================================================

async function loadSubmittedQuotations(
    manufacturerId
) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "quotations"
                )
            );


        const quotations = [];


        // =================================================
        // FILTER MANUFACTURER'S QUOTATIONS
        // =================================================

        snapshot.forEach(
            (quotationDoc) => {

                const data =
                    quotationDoc.data();


                const quotationManufacturerId =
                    data.manufacturerId ||
                    data.companyId ||
                    data.submittedBy ||
                    data.createdBy ||
                    "";


                if (
                    quotationManufacturerId ===
                    manufacturerId
                ) {

                    quotations.push({

                        id:
                            quotationDoc.id,

                        ...data

                    });

                }

            }
        );


        // =================================================
        // EMPTY
        // =================================================

        if (
            quotations.length === 0
        ) {

            quotationTable.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        style="
                            text-align:center;
                            padding:40px;
                            color:#666;
                        "
                    >

                        No quotations submitted yet.

                    </td>

                </tr>

            `;

            return;

        }


        // =================================================
        // LOAD CUSTOMER NAMES
        // =================================================

        for (
            const quotation
            of quotations
        ) {

            await loadCustomerName(
                quotation
            );

        }


        // =================================================
        // DISPLAY
        // =================================================

        quotationTable.innerHTML =
            "";


        quotations.forEach(
            (quotation) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                // ------------------------------------------
                // CUSTOMER NAME
                // ------------------------------------------

                const customerName =
                    quotation.customerName ||
                    quotation.clientName ||
                    quotation.buyerName ||
                    quotation.customerCompanyName ||
                    "Customer";


                // ------------------------------------------
                // REQUIREMENT
                // ------------------------------------------

                const requirement =
                    quotation.requirementTitle ||
                    quotation.title ||
                    quotation.requirementName ||
                    "Requirement";


                // ------------------------------------------
                // PRICE
                // ------------------------------------------

                const price =
                    quotation.price ||
                    "0";


                // ------------------------------------------
                // DELIVERY
                // ------------------------------------------

                const delivery =
                    quotation.delivery ||
                    quotation.deliveryTime ||
                    "Not specified";


                // ------------------------------------------
                // RATING
                // ------------------------------------------

                const ratingValue =
                    Number(
                        quotation.rating || 0
                    );


                let ratingHTML = "";


                if (
                    ratingValue > 0
                ) {

                    ratingHTML =
                        "⭐".repeat(
                            Math.min(
                                ratingValue,
                                5
                            )
                        );

                }

                else {

                    ratingHTML =
                        "—";

                }


                // ------------------------------------------
                // STATUS
                // ------------------------------------------

                const status =
                    quotation.status ||
                    "Waiting";


                const statusClass =
                    getStatusClass(
                        status
                    );


                // ------------------------------------------
                // ROW
                // ------------------------------------------

                const isAccepted = status.toString().trim().toLowerCase() === "accepted";
                const stageText = quotation.manufacturingStage || "Order Confirmed";

                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            customerName
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            requirement
                        )}
                    </td>

                    <td>
                        ₹${escapeHTML(
                            price
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            delivery
                        )}
                    </td>

                    

                    <td>

                        <span
                            class="status ${statusClass}"
                        >

                            ${escapeHTML(
                                status
                            )}

                        </span>

                        ${isAccepted ? `
                            <div style="margin-top:6px; font-size:11px; color:#2563eb; font-weight:700;">
                                Stage: ${escapeHTML(stageText)}
                            </div>
                        ` : ""}

                    </td>

                    <td>

                        ${isAccepted ? `
                            <button
                                class="table-track-btn"
                                onclick="openManufacturingUpdateModal('${quotation.id}')"
                            >
                                ⚙️ Update Stage
                            </button>
                        ` : `
                            <button
                                class="view-btn"
                                disabled
                            >
                                View
                            </button>
                        `}

                    </td>

                `;


                quotationTable.appendChild(
                    row
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Submitted quotations error:",
            error
        );


        quotationTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:40px;
                        color:red;
                    "
                >

                    Unable to load quotations.

                </td>

            </tr>

        `;

    }

}


// ======================================================
// LOAD CUSTOMER NAME
// ======================================================

async function loadCustomerName(
    quotation
) {

    // Already available
    if (
        quotation.customerName &&
        quotation.customerName !== "Customer"
    ) {

        return;

    }


    try {

        let customerId =
            quotation.customerId ||
            quotation.clientId ||
            quotation.buyerId ||
            "";


        // ----------------------------------------------
        // IF CUSTOMER ID NOT AVAILABLE
        // GET FROM REQUIREMENT
        // ----------------------------------------------

        if (
            !customerId &&
            quotation.requirementId
        ) {

            const requirementRef =
                doc(
                    db,
                    "requirements",
                    quotation.requirementId
                );


            const requirementSnapshot =
                await getDoc(
                    requirementRef
                );


            if (
                requirementSnapshot.exists()
            ) {

                const requirementData =
                    requirementSnapshot.data();


                customerId =
                    requirementData.userId ||
                    requirementData.customerId ||
                    "";

            }

        }


        if (!customerId) {

            return;

        }


        // ----------------------------------------------
        // LOAD USER
        // ----------------------------------------------

        const userRef =
            doc(
                db,
                "users",
                customerId
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (
            !userSnapshot.exists()
        ) {

            return;

        }


        const userData =
            userSnapshot.data();


        quotation.customerName =
            userData.companyName ||
            userData.company ||
            userData.businessName ||
            userData.name ||
            userData.ownerName ||
            "Customer";

    }

    catch (error) {

        console.error(
            "Customer name error:",
            error
        );

    }

}


// ======================================================
// STATUS CLASS
// ======================================================

function getStatusClass(
    status
) {

    const value =
        String(status)
            .toLowerCase()
            .trim();


    if (
        value === "accepted"
    ) {

        return "accepted";

    }


    if (
        value === "rejected"
    ) {

        return "rejected";

    }


    return "waiting";

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

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
window.loadSubmittedQuotations = loadSubmittedQuotations;
