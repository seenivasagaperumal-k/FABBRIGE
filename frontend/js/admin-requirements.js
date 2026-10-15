import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const requirementsTable =
    document.getElementById("requirementsTable");

const searchInput =
    document.getElementById("searchInput");

const logoutBtn =
    document.getElementById("logoutBtn");

let requirements = [];


// Check Login

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("login.html");

        return;

    }

    await loadRequirements();

});


// Load Requirements

async function loadRequirements() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "requirements")
            );

        requirements = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            requirements.push({

                customer:
                    data.customerEmail || "-",

                title:
                    data.title || "-",

                category:
                    data.subcategory ? `${data.category || "-"} (${data.subcategory})` : (data.category || "-"),

                quantity:
                    data.quantity || "-",

                budget:
                    data.budget || "-",

                deadline:
                    data.deadline || "-",

                status:
                    data.status || "Pending"

            });

        });

        displayRequirements(requirements);

    }

    catch (error) {

        console.error(error);

        requirementsTable.innerHTML = `

            <tr>

                <td colspan="7"
                    class="loading">

                    Error loading requirements.

                </td>

            </tr>

        `;

    }

}


// Display

function displayRequirements(list) {

    requirementsTable.innerHTML = "";

    if (list.length === 0) {

        requirementsTable.innerHTML = `

            <tr>

                <td colspan="7"
                    class="loading">

                    No requirements found.

                </td>

            </tr>

        `;

        return;

    }

    list.forEach((item) => {

        let statusClass =
            item.status
                .toLowerCase();

        requirementsTable.innerHTML += `

            <tr>

                <td>${item.customer}</td>

                <td>${item.title}</td>

                <td>${item.category}</td>

                <td>${item.quantity}</td>

                <td>₹${item.budget}</td>

                <td>${item.deadline}</td>

                <td>

                    <span class="${statusClass}">

                        ${item.status}

                    </span>

                </td>

            </tr>

        `;

    });

}


// Search

searchInput.addEventListener(
    "input",
    () => {

        const text =
            searchInput.value
                .toLowerCase();

        const filtered =
            requirements.filter((item) =>

                item.title
                    .toLowerCase()
                    .includes(text)

                ||

                item.customer
                    .toLowerCase()
                    .includes(text)

                ||

                item.category
                    .toLowerCase()
                    .includes(text)

            );

        displayRequirements(filtered);

    }
);


// Logout

logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
            window.location.replace("login.html");

    }
);

// Prevent back button from showing protected page after logout
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        onAuthStateChanged(auth, (user) => {
            if (!user) window.location.replace("login.html");
        });
    }
});
