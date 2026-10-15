import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==================================================
// GET USER ID
// ==================================================

const params =
    new URLSearchParams(window.location.search);

const userId =
    params.get("userId");


// ==================================================
// HTML ELEMENTS
// ==================================================

const companyName =
    document.getElementById("companyName");

const companyOwner =
    document.getElementById("companyOwner");

const companyEmail =
    document.getElementById("companyEmail");

const phone =
    document.getElementById("phone");

const location =
    document.getElementById("location");

const companyType =
    document.getElementById("companyType");

const about =
    document.getElementById("about");

const productsContainer =
    document.getElementById("productsContainer");

const servicesContainer =
    document.getElementById("servicesContainer");


// ==================================================
// CHECK USER ID
// ==================================================

if (!userId) {

    if (companyName) {
        companyName.textContent =
            "Company not found";
    }

} else {

    loadCompany();

}


// ==================================================
// LOAD COMPANY
// ==================================================

async function loadCompany() {

    try {

        const userRef =
            doc(
                db,
                "users",
                userId
            );

        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            companyName.textContent =
                "Company not found";

            return;
        }


        const data =
            userSnapshot.data();


        console.log(
            "Company data:",
            data
        );


        // ==================================================
        // COMPANY NAME
        // ==================================================

        companyName.textContent =
            data.companyName ||
            data.company ||
            data.businessName ||
            data.organizationName ||
            "Company";


        // ==================================================
        // OWNER
        // ==================================================

        companyOwner.textContent =
            data.ownerName ||
            data.name ||
            data.fullName ||
            data.username ||
            "Company Owner";


        // ==================================================
        // EMAIL
        // ==================================================

        companyEmail.textContent =
            data.email ||
            "Email not available";


        // ==================================================
        // PHONE
        // ==================================================

        phone.textContent =
            data.phone ||
            data.phoneNumber ||
            "Not available";


        // ==================================================
        // ADDRESS
        // ==================================================
        // Address first priority.
        // If address is not available,
        // location/city will be used.
        // ==================================================

        location.textContent =
            data.address ||
            data.fullAddress ||
            data.companyAddress ||
            data.location ||
            data.city ||
            "Address not available";


        // ==================================================
        // COMPANY TYPE
        // ==================================================

        companyType.textContent =
            data.companyType ||
            data.type ||
            "Manufacturing";


        // ==================================================
        // ABOUT COMPANY
        // ==================================================

        about.textContent =
            data.about ||
            "About information not added.";


        // ==================================================
        // PRODUCTS
        // ==================================================

        await loadProducts();


        // ==================================================
        // SERVICES
        // ==================================================

        await loadServices();

    }

    catch (error) {

        console.error(
            "Company profile error:",
            error
        );

        companyName.textContent =
            "Unable to load company";

    }

}


// ==================================================
// LOAD PRODUCTS
// ==================================================

async function loadProducts() {

    try {

        const productsQuery =
            query(
                collection(
                    db,
                    "products"
                ),
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const snapshot =
            await getDocs(
                productsQuery
            );


        if (snapshot.empty) {

            productsContainer.innerHTML = `
                <p class="empty-message">
                    No products added by this company.
                </p>
            `;

            return;
        }


        productsContainer.innerHTML =
            "";


        snapshot.forEach(
            (productDoc) => {

                const product =
                    productDoc.data();


                const card =
                    document.createElement("div");


                card.className =
                    "product-card";


                card.innerHTML = `

                    <h3>
                        📦 ${safe(
                            product.productName ||
                            "Product"
                        )}
                    </h3>

                    <p>
                        ${safe(
                            product.description ||
                            "No description available."
                        )}
                    </p>

                    <p>
                        <strong>
                            Category:
                        </strong>

                        ${safe(
                            product.category ||
                            "Other"
                        )}
                    </p>

                    <p>
                        <strong>
                            Price:
                        </strong>

                        ₹${safe(
                            product.price ??
                            "Not available"
                        )}
                    </p>

                    <p>
                        <strong>
                            Quantity:
                        </strong>

                        ${safe(
                            product.quantity ??
                            "Not available"
                        )}
                    </p>

                `;


                productsContainer.appendChild(
                    card
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        productsContainer.innerHTML = `
            <p class="empty-message">
                Unable to load products.
            </p>
        `;

    }

}


// ==================================================
// LOAD SERVICES
// ==================================================

async function loadServices() {

    try {

        const servicesQuery =
            query(
                collection(
                    db,
                    "services"
                ),
                where(
                    "userId",
                    "==",
                    userId
                )
            );


        const snapshot =
            await getDocs(
                servicesQuery
            );


        if (snapshot.empty) {

            servicesContainer.innerHTML = `
                <p class="empty-message">
                    No services added by this company.
                </p>
            `;

            return;
        }


        servicesContainer.innerHTML =
            "";


        snapshot.forEach(
            (serviceDoc) => {

                const service =
                    serviceDoc.data();


                const card =
                    document.createElement("div");


                card.className =
                    "service-card";


                card.innerHTML = `

                    <h3>
                        🛠️ ${safe(
                            service.serviceName ||
                            "Service"
                        )}
                    </h3>

                    <p>
                        ${safe(
                            service.description ||
                            "No description available."
                        )}
                    </p>

                    <p>
                        <strong>
                            Category:
                        </strong>

                        ${safe(
                            service.category ||
                            "Other"
                        )}
                    </p>

                    <p>
                        <strong>
                            Price:
                        </strong>

                        ₹${safe(
                            service.price ??
                            "Not available"
                        )}
                    </p>

                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        <button
                            class="contact-btn"
                            onclick="window.openContactModalForProfile('${safe(service.serviceName)}', '${safe(service.category)}', '${safe(service.price)}')"
                            style="width: 100%;"
                        >
                            📞 Contact for Service
                        </button>
                    </div>

                `;


                servicesContainer.appendChild(
                    card
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Service loading error:",
            error
        );

        servicesContainer.innerHTML = `
            <p class="empty-message">
                Unable to load services.
            </p>
        `;

    }

}


// ==================================================
// SAFE HTML
// ==================================================

function safe(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}