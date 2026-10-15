// ======================================================
// FABBRIDGE - MY REQUIREMENTS
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ======================================================
// HTML ELEMENTS
// ======================================================

const requirementsTable =
    document.getElementById("requirementsTable");

const emptyMessage =
    document.getElementById("emptyMessage");


// ======================================================
// AUTHENTICATION
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // User login pannala
        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        console.log(
            "Logged-in user:",
            user.uid
        );


        // Load ONLY current user's requirements
        await loadMyRequirements(
            user.uid
        );

    }
);


// ======================================================
// LOAD MY REQUIREMENTS
// ======================================================

async function loadMyRequirements(userId) {

    try {

        // ------------------------------------------------
        // IMPORTANT
        // ------------------------------------------------
        // requirements collection-la
        // userId == currently logged-in user UID
        // irukkura documents mattum edukkum.
        // ------------------------------------------------

        const requirementsQuery =
            query(
                collection(
                    db,
                    "requirements"
                ),

                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const snapshot =
            await getDocs(
                requirementsQuery
            );


        console.log(
            "My requirements:",
            snapshot.size
        );


        // Clear table
        requirementsTable.innerHTML =
            "";


        // =================================================
        // NO REQUIREMENTS
        // =================================================

        if (snapshot.empty) {

            emptyMessage.style.display =
                "block";

            return;

        }


        // Hide empty message
        emptyMessage.style.display =
            "none";


        // =================================================
        // DISPLAY REQUIREMENTS
        // =================================================

        let index = 1;


        snapshot.forEach(
            (requirementDoc) => {

                const data =
                    requirementDoc.data();


                // Requirement title
                const title =
                    data.title ||
                    data.requirementTitle ||
                    "Untitled";


                // Category & Subcategory
                const category =
                    data.category ||
                    "Not specified";

                const subcategoryHtml = data.subcategory
                    ? `<span style="display: block; font-size: 11px; color: var(--fb-slate-500); margin-top: 2px;">${escapeHTML(data.subcategory)}</span>`
                    : "";

                // Budget
                const budget =
                    data.budget ||
                    "0";


                // Status
                const status =
                    data.status ||
                    "Pending";


                // Status class
                const statusClass =
                    getStatusClass(
                        status
                    );


                // =================================================
                // TABLE ROW
                // =================================================

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        #${index}
                    </td>

                    <td>
                        <strong>${escapeHTML(title)}</strong>
                    </td>

                    <td>
                        <span>${escapeHTML(category)}</span>
                        ${subcategoryHtml}
                    </td>

                    <td>
                        ₹${escapeHTML(budget)}
                    </td>

                    <td>

                        <span
                            class="status ${statusClass}">

                            ${escapeHTML(status)}

                        </span>

                    </td>

                `;


                requirementsTable.appendChild(
                    row
                );


                index++;

            }
        );


    }

    catch (error) {

        console.error(
            "Error loading my requirements:",
            error
        );


        requirementsTable.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="error">

                    Unable to load your requirements.

                </td>

            </tr>

        `;

    }

}


// ======================================================
// STATUS CLASS
// ======================================================

function getStatusClass(status) {

    const value =
        String(status)
            .toLowerCase()
            .trim();


    if (value === "accepted") {

        return "accepted";

    }


    if (value === "rejected") {

        return "rejected";

    }


    if (
        value === "pending" ||
        value === "waiting"
    ) {

        return "pending";

    }


    return "pending";

}


// ======================================================
// SECURITY HELPER
// ======================================================

function escapeHTML(value) {

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