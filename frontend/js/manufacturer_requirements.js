import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const requirementsGrid =
    document.getElementById("requirementsGrid");

const searchInput =
    document.getElementById("searchInput");

const searchBtn =
    document.getElementById("searchBtn");


let requirements = [];


// Check login
onAuthStateChanged(auth, async (user) => {

    if (!user) {

        alert("Please login first.");

        window.location.replace("login.html");

        return;

    }

    await loadRequirements();

});


// Load requirements from Firebase
async function loadRequirements() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "requirements")
            );


        requirements = [];


        snapshot.forEach((requirementDoc) => {

            const data =
                requirementDoc.data();


            requirements.push({

                id: requirementDoc.id,

                userId:
                    data.userId || "",

                title:
                    data.title || "Untitled Requirement",

                category:
                    data.category || "Not specified",

                description:
                    data.description || "No description available.",

                quantity:
                    data.quantity || "Not specified",

                budget:
                    data.budget || "0",

                deadline:
                    data.deadline || "Not specified",

                status:
                    data.status || "Pending"

            });

        });


        displayRequirements(requirements);

    }

    catch (error) {

        console.error(
            "Error loading requirements:",
            error
        );


        requirementsGrid.innerHTML = `

            <p class="no-results">

                Unable to load customer requirements.

            </p>

        `;

    }

}


// Display requirements
function displayRequirements(list) {

    requirementsGrid.innerHTML = "";


    if (list.length === 0) {

        requirementsGrid.innerHTML = `

            <p class="no-results">

                No customer requirements found.

            </p>

        `;

        return;

    }


    list.forEach((requirement) => {

        const card =
            document.createElement("div");


        card.className =
            "requirement-card";


        card.innerHTML = `

            <h2>
                ${requirement.title}
            </h2>

            <p>
                <strong>Category:</strong>
                ${requirement.category}
            </p>

            <p>
                <strong>Description:</strong>
                ${requirement.description}
            </p>

            <p>
                <strong>Quantity:</strong>
                ${requirement.quantity}
            </p>

            <p>
                <strong>Budget:</strong>
                ₹${requirement.budget}
            </p>

            <p>
                <strong>Deadline:</strong>
                ${requirement.deadline}
            </p>

            <span class="requirement-status">
                ${requirement.status}
            </span>

            <button
                class="quote-btn"
                data-id="${requirement.id}">

                Submit Quotation

            </button>

        `;


        const quoteButton =
            card.querySelector(".quote-btn");


        quoteButton.addEventListener(
            "click",
            () => {

                submitQuotation(
                    requirement
                );

            }
        );


        requirementsGrid.appendChild(card);

    });

}


// Search
function searchRequirements() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    if (searchText === "") {

        displayRequirements(
            requirements
        );

        return;

    }


    const filtered =
        requirements.filter(
            (requirement) => {

                return (

                    requirement.title
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    requirement.category
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    requirement.description
                        .toLowerCase()
                        .includes(searchText)

                );

            }
        );


    displayRequirements(filtered);

}


// Submit quotation
function submitQuotation(requirement) {

    const params =
        new URLSearchParams({

            requirementId:
                requirement.id,

            requirementTitle:
                requirement.title,

            customerId:
                requirement.userId,

            budget:
                requirement.budget

        });


    window.location.href =
        `submit_quotation.html?${params.toString()}`;

}


// Search button
searchBtn.addEventListener(
    "click",
    searchRequirements
);


// Search while typing
searchInput.addEventListener(
    "input",
    searchRequirements
);

// Prevent back button from showing protected page after logout
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        onAuthStateChanged(auth, (user) => {
            if (!user) window.location.replace("login.html");
        });
    }
});
