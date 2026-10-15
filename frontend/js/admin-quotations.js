import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const quotationsTable =
    document.getElementById("quotationsTable");

const searchInput =
    document.getElementById("searchInput");

const logoutBtn =
    document.getElementById("logoutBtn");

let quotations = [];

// Check Login

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    await loadQuotations();

});

// Load Quotations

async function loadQuotations() {

    try {

        const snapshot = await getDocs(
            collection(db, "quotations")
        );

        quotations = [];

        snapshot.forEach((quotationDoc) => {

            const data = quotationDoc.data();

            quotations.push({

                id: quotationDoc.id,

                companyName: data.companyName || "-",

                customerEmail: data.customerEmail || "-",

                requirementTitle: data.requirementTitle || "-",

                price: data.price || "-",

                delivery: data.delivery || "-",

                rating: data.rating || "⭐⭐⭐⭐⭐",

                status: data.status || "Waiting"

            });

        });

        displayQuotations(quotations);

    }

    catch (error) {

        console.error(error);

        quotationsTable.innerHTML = `

        <tr>
            <td colspan="8" class="loading">
                Error loading quotations.
            </td>
        </tr>

        `;

    }

}

// Display

function displayQuotations(list) {

    quotationsTable.innerHTML = "";

    if (list.length === 0) {

        quotationsTable.innerHTML = `

        <tr>
            <td colspan="8" class="loading">
                No quotations found.
            </td>
        </tr>

        `;

        return;

    }

    list.forEach((item) => {

        let statusClass = item.status.toLowerCase();

        quotationsTable.innerHTML += `

        <tr>

            <td>${item.companyName}</td>

            <td>${item.customerEmail}</td>

            <td>${item.requirementTitle}</td>

            <td>₹${item.price}</td>

            <td>${item.delivery}</td>

            <td>${item.rating}</td>

            <td>

                <span class="status ${statusClass}">
                    ${item.status}
                </span>

            </td>

           

        </tr>

        `;

    });


}

// Search

searchInput.addEventListener("input", () => {

    const text =
        searchInput.value
        .toLowerCase()
        .trim();

    const filtered = quotations.filter(item =>

        item.companyName.toLowerCase().includes(text)

        ||

        item.customerEmail.toLowerCase().includes(text)

        ||

        item.requirementTitle.toLowerCase().includes(text)

    );

    displayQuotations(filtered);

});

// Logout

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

});

// Prevent back button from showing protected page after logout
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        onAuthStateChanged(auth, (user) => {
            if (!user) window.location.replace("login.html");
        });
    }
});
