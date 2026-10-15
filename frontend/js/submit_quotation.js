// ======================================================
// FABBRIDGE - SUBMIT QUOTATION
// ======================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ======================================================
// HTML ELEMENTS
// ======================================================

const quotationForm =
    document.getElementById("quotationForm");

const companyNameInput =
    document.getElementById("companyName");

const customerEmailInput =
    document.getElementById("customerEmail");

const requirementTitleInput =
    document.getElementById("requirementTitle");

const requirementCategoryInput =
    document.getElementById("requirementCategory");

const requirementDescriptionInput =
    document.getElementById("requirementDescription");

const priceInput =
    document.getElementById("price");

const deliveryInput =
    document.getElementById("delivery");

const ratingInput =
    document.getElementById("rating");

const quotationDescriptionInput =
    document.getElementById("description");

const submitBtn =
    document.getElementById("submitBtn");


// ======================================================
// URL PARAMETERS
// ======================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const requirementId =
    urlParams.get("requirementId");


const returnPage =
    urlParams.get("return");


// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;

let requirementData = null;

let customerData = null;


// ======================================================
// AUTHENTICATION
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        // ------------------------------------------
        // REQUIREMENT ID CHECK
        // ------------------------------------------

        if (!requirementId) {

            alert(
                "Requirement ID not found."
            );

            return;

        }


        // ------------------------------------------
        // LOAD REQUIREMENT
        // ------------------------------------------

        await loadRequirement();

    }
);


// ======================================================
// LOAD REQUIREMENT
// ======================================================

async function loadRequirement() {

    try {

        // ------------------------------------------
        // GET REQUIREMENT
        // ------------------------------------------

        const requirementRef =
            doc(
                db,
                "requirements",
                requirementId
            );


        const requirementSnapshot =
            await getDoc(
                requirementRef
            );


        if (
            !requirementSnapshot.exists()
        ) {

            alert(
                "Requirement does not exist."
            );

            return;

        }


        requirementData =
            requirementSnapshot.data();


        // ------------------------------------------
        // REQUIREMENT TITLE
        // ------------------------------------------

        const requirementTitle =
            requirementData.title ||
            requirementData.requirementTitle ||
            "Requirement";


        if (requirementTitleInput) {

            requirementTitleInput.value =
                requirementTitle;

        }


        // ------------------------------------------
        // CATEGORY
        // ------------------------------------------

        if (requirementCategoryInput) {

            requirementCategoryInput.value =
                requirementData.category ||
                "Not specified";

        }


        // ------------------------------------------
        // DESCRIPTION
        // ------------------------------------------

        if (requirementDescriptionInput) {

            requirementDescriptionInput.value =
                requirementData.description ||
                "No description";

        }


        // ------------------------------------------
        // CUSTOMER ID
        // ------------------------------------------

        const customerId =
            requirementData.userId ||
            requirementData.customerId ||
            requirementData.postedBy ||
            "";


        if (!customerId) {

            console.error(
                "Customer ID is missing from requirement."
            );


            if (companyNameInput) {

                companyNameInput.value =
                    "Customer";

            }


            return;

        }


        // ------------------------------------------
        // PREVENT OWN REQUIREMENT QUOTATION
        // ------------------------------------------

        if (
            currentUser &&
            currentUser.uid === customerId
        ) {

            alert(
                "You cannot submit a quotation for your own requirement."
            );

            return;

        }


        // ------------------------------------------
        // GET CUSTOMER PROFILE
        // ------------------------------------------

        const customerRef =
            doc(
                db,
                "users",
                customerId
            );


        const customerSnapshot =
            await getDoc(
                customerRef
            );


        if (
            customerSnapshot.exists()
        ) {

            customerData =
                customerSnapshot.data();


            // --------------------------------------
            // CUSTOMER / COMPANY NAME
            // --------------------------------------

            const customerName =
                customerData.companyName ||
                customerData.company ||
                customerData.businessName ||
                customerData.organizationName ||
                customerData.name ||
                customerData.ownerName ||
                "Customer";


            if (companyNameInput) {

                companyNameInput.value =
                    customerName;

            }


            // --------------------------------------
            // CUSTOMER EMAIL
            // --------------------------------------

            const customerEmail =
                customerData.email ||
                customerData.emailAddress ||
                "";


            if (customerEmailInput) {

                customerEmailInput.value =
                    customerEmail;

            }

        }

        else {

            if (companyNameInput) {

                companyNameInput.value =
                    "Customer";

            }

        }

    }

    catch (error) {

        console.error(
            "Requirement loading error:",
            error
        );


        alert(
            "Unable to load requirement details."
        );

    }

}


// ======================================================
// SUBMIT QUOTATION
// ======================================================

if (quotationForm) {

    quotationForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            try {

                // ==========================================
                // LOGIN CHECK
                // ==========================================

                if (!currentUser) {

                    alert(
                        "Please login first."
                    );

                    return;

                }


                // ==========================================
                // REQUIREMENT CHECK
                // ==========================================

                if (!requirementData) {

                    alert(
                        "Requirement details are still loading. Please wait."
                    );

                    return;

                }


                // ==========================================
                // CUSTOMER ID
                // ==========================================

                const customerId =
                    requirementData.userId ||
                    requirementData.customerId ||
                    requirementData.postedBy ||
                    "";


                if (!customerId) {

                    alert(
                        "Requirement owner information is missing."
                    );

                    return;

                }


                // ==========================================
                // PREVENT SELF QUOTATION
                // ==========================================

                if (
                    currentUser.uid ===
                    customerId
                ) {

                    alert(
                        "You cannot submit a quotation for your own requirement."
                    );

                    return;

                }


                // ==========================================
                // CUSTOMER NAME
                // ==========================================

                const customerName =
                    customerData?.companyName ||
                    customerData?.company ||
                    customerData?.businessName ||
                    customerData?.organizationName ||
                    customerData?.name ||
                    customerData?.ownerName ||
                    "Customer";


                // ==========================================
                // CUSTOMER EMAIL
                // ==========================================

                const customerEmail =
                    customerData?.email ||
                    customerData?.emailAddress ||
                    "";


                // ==========================================
                // GET MANUFACTURER PROFILE
                // ==========================================

                let manufacturerName =
                    "Manufacturer";


                const manufacturerRef =
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    );


                const manufacturerSnapshot =
                    await getDoc(
                        manufacturerRef
                    );


                if (
                    manufacturerSnapshot.exists()
                ) {

                    const manufacturerData =
                        manufacturerSnapshot.data();


                    manufacturerName =
                        manufacturerData.companyName ||
                        manufacturerData.company ||
                        manufacturerData.businessName ||
                        manufacturerData.organizationName ||
                        manufacturerData.name ||
                        manufacturerData.ownerName ||
                        "Manufacturer";

                }


                // ==========================================
                // FORM VALUES
                // ==========================================

                const price =
                    priceInput?.value
                        ?.trim() ||
                    "";


                const delivery =
                    deliveryInput?.value
                        ?.trim() ||
                    "";


                const quotationDescription =
                    quotationDescriptionInput
                        ?.value
                        ?.trim() ||
                    "";


                const selectedRating =
                    ratingInput?.value ||
                    "";


                // ==========================================
                // VALIDATION
                // ==========================================

                if (
                    !price ||
                    Number(price) <= 0
                ) {

                    alert(
                        "Please enter a valid quotation price."
                    );

                    return;

                }


                if (!delivery) {

                    alert(
                        "Please enter delivery time."
                    );

                    return;

                }


                if (!quotationDescription) {

                    alert(
                        "Please enter quotation description."
                    );

                    return;

                }


                // ==========================================
                // DISABLE SUBMIT BUTTON
                // ==========================================

                if (submitBtn) {

                    submitBtn.disabled =
                        true;

                    submitBtn.textContent =
                        "Submitting...";

                }


                // ==========================================
                // REQUIREMENT TITLE
                // ==========================================

                const requirementTitle =
                    requirementData.title ||
                    requirementData.requirementTitle ||
                    "Requirement";


                // ==========================================
                // SAVE QUOTATION
                // ==========================================

                const quotationRef =
                    await addDoc(
                        collection(
                            db,
                            "quotations"
                        ),
                        {

                            // --------------------------------
                            // REQUIREMENT
                            // --------------------------------

                            requirementId:
                                requirementId,

                            requirementTitle:
                                requirementTitle,

                            requirementCategory:
                                requirementData.category ||
                                "",


                            requirementDescription:
                                requirementData.description ||
                                "",


                            // --------------------------------
                            // CUSTOMER / REQUIREMENT OWNER
                            // --------------------------------

                            customerId:
                                customerId,

                            customerName:
                                customerName,

                            customerEmail:
                                customerEmail,


                            // --------------------------------
                            // MANUFACTURER / QUOTATION OWNER
                            // --------------------------------

                            manufacturerId:
                                currentUser.uid,

                            manufacturerName:
                                manufacturerName,

                            manufacturerEmail:
                                currentUser.email ||
                                "",


                            // --------------------------------
                            // QUOTATION
                            // --------------------------------

                            price:
                                price,

                            delivery:
                                delivery,

                            rating:
                                selectedRating,

                            description:
                                quotationDescription,


                            // --------------------------------
                            // STATUS
                            // --------------------------------

                            status:
                                "Waiting",


                            // --------------------------------
                            // TIMESTAMP
                            // --------------------------------

                            createdAt:
                                serverTimestamp()

                        }
                    );


                console.log(
                    "Quotation saved:",
                    quotationRef.id
                );


                // ==========================================
                // CREATE CUSTOMER NOTIFICATION
                // ==========================================

                await addDoc(
                    collection(
                        db,
                        "notifications"
                    ),
                    {

                        // --------------------------------
                        // RECEIVER
                        // --------------------------------

                        userId:
                            customerId,


                        // --------------------------------
                        // NOTIFICATION TYPE
                        // --------------------------------

                        type:
                            "new_quotation",


                        // --------------------------------
                        // NOTIFICATION TITLE
                        // --------------------------------

                        title:
                            "New Quotation Received",


                        // --------------------------------
                        // NOTIFICATION MESSAGE
                        // --------------------------------

                        message:
                            manufacturerName +
                            ' submitted a quotation for "' +
                            requirementTitle +
                            '".',


                        // --------------------------------
                        // MANUFACTURER
                        // --------------------------------

                        manufacturerId:
                            currentUser.uid,

                        manufacturerName:
                            manufacturerName,

                        manufacturerEmail:
                            currentUser.email ||
                            "",


                        // --------------------------------
                        // CUSTOMER
                        // --------------------------------

                        customerId:
                            customerId,

                        customerName:
                            customerName,


                        // --------------------------------
                        // REQUIREMENT
                        // --------------------------------

                        requirementId:
                            requirementId,

                        requirementTitle:
                            requirementTitle,


                        // --------------------------------
                        // QUOTATION
                        // --------------------------------

                        quotationId:
                            quotationRef.id,

                        price:
                            price,

                        delivery:
                            delivery,


                        // --------------------------------
                        // NOTIFICATION STATUS
                        // --------------------------------

                        read:
                            false,


                        // --------------------------------
                        // TIMESTAMP
                        // --------------------------------

                        createdAt:
                            serverTimestamp()

                    }
                );


                console.log(
                    "Customer notification created successfully."
                );


                // ==========================================
                // SUCCESS
                // ==========================================

                alert(
                    "Quotation submitted successfully!"
                );


                // ==========================================
                // RETURN TO MARKETPLACE
                // ==========================================

                window.location.href =
                    "marketplace.html";

            }

            catch (error) {

                console.error(
                    "Quotation submission error:",
                    error
                );


                alert(
                    "Unable to submit quotation.\n\n" +
                    error.message
                );


                // ------------------------------------------
                // RESET BUTTON
                // ------------------------------------------

                if (submitBtn) {

                    submitBtn.disabled =
                        false;

                    submitBtn.textContent =
                        "Submit Quotation";

                }

            }

        }
    );

}