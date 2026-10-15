import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==========================================
// HTML ELEMENTS
// ==========================================

const addProductBtn =
    document.getElementById("addProductBtn");

const closeFormBtn =
    document.getElementById("closeFormBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const productFormCard =
    document.getElementById("productFormCard");

const productForm =
    document.getElementById("productForm");

const productsList =
    document.getElementById("productsList");

const productCount =
    document.getElementById("productCount");

const submitBtn =
    document.getElementById("submitBtn");


// Form fields

const productName =
    document.getElementById("productName");

const category =
    document.getElementById("category");

const description =
    document.getElementById("description");

const price =
    document.getElementById("price");

const quantity =
    document.getElementById("quantity");


// ==========================================
// EDIT MODE
// ==========================================

let editingProductId = null;


// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;


// ==========================================
// OPEN FORM
// ==========================================

function openProductForm() {

    productFormCard.classList.remove("hidden");

    productName.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// CLOSE FORM
// ==========================================

function closeProductForm() {

    productFormCard.classList.add("hidden");

    productForm.reset();

    editingProductId = null;

    submitBtn.textContent =
        "➕ Add Product";
}


// ==========================================
// BUTTON EVENTS
// ==========================================

addProductBtn.addEventListener(
    "click",
    () => {

        openProductForm();

    }
);


closeFormBtn.addEventListener(
    "click",
    () => {

        closeProductForm();

    }
);


cancelBtn.addEventListener(
    "click",
    () => {

        closeProductForm();

    }
);


// ==========================================
// LOGIN CHECK
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        currentUser = user;


        await loadProducts(
            user.uid
        );

    }
);


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts(userId) {

    try {

        productsList.innerHTML = `

            <div class="loading">

                Loading products...

            </div>

        `;


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


        productsList.innerHTML = "";


        // ==================================
        // NO PRODUCTS
        // ==================================

        if (snapshot.empty) {

            productCount.textContent =
                "0 Products";


            productsList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        📦
                    </div>

                    <h3>
                        No Products Yet
                    </h3>

                    <p>
                        Add your first product
                        using the
                        <b>+ Add Product</b>
                        button.
                    </p>

                </div>

            `;

            return;
        }


        // ==================================
        // PRODUCT COUNT
        // ==================================

        productCount.textContent =
            snapshot.size +
            (
                snapshot.size === 1
                    ? " Product"
                    : " Products"
            );


        // ==================================
        // DISPLAY PRODUCTS
        // ==================================

        snapshot.forEach(
            (productDoc) => {

                const data =
                    productDoc.data();


                productsList.innerHTML += `

                    <div class="product-card">

                        <h3>
                            ${
                                escapeHTML(
                                    data.productName ||
                                    "Unnamed Product"
                                )
                            }
                        </h3>


                        <span
                            class="product-category"
                        >

                            ${
                                escapeHTML(
                                    data.category ||
                                    "Other"
                                )
                            }

                        </span>


                        <p
                            class="product-description"
                        >

                            ${
                                escapeHTML(
                                    data.description ||
                                    "No description provided."
                                )
                            }

                        </p>


                        <div
                            class="product-details"
                        >

                            <span
                                class="product-price"
                            >

                                ₹${
                                    escapeHTML(
                                        String(
                                            data.price || "0"
                                        )
                                    )
                                }

                            </span>


                            <span
                                class="product-quantity"
                            >

                                Quantity:
                                ${
                                    escapeHTML(
                                        String(
                                            data.quantity || "0"
                                        )
                                    )
                                }

                            </span>

                        </div>


                        <div
                            class="product-actions"
                        >

                            <button
                                class="edit-btn"
                                onclick="
                                    editProduct(
                                        '${productDoc.id}'
                                    )
                                "
                            >

                                ✏️ Edit

                            </button>


                            <button
                                class="delete-btn"
                                onclick="
                                    deleteProduct(
                                        '${productDoc.id}'
                                    )
                                "
                            >

                                🗑️ Delete

                            </button>

                        </div>

                    </div>

                `;

            }
        );

    }

    catch (error) {

        console.error(
            "Error loading products:",
            error
        );


        productsList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to Load Products
                </h3>

                <p>
                    ${
                        escapeHTML(
                            error.message
                        )
                    }
                </p>

            </div>

        `;

    }

}


// ==========================================
// ADD / UPDATE PRODUCT
// ==========================================

productForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            alert(
                "Please login first."
            );

            return;
        }


        // ==================================
        // GET VALUES
        // ==================================

        const productNameValue =
            productName.value.trim();

        const categoryValue =
            category.value.trim();

        const descriptionValue =
            description.value.trim();

        const priceValue =
            price.value.trim();

        const quantityValue =
            quantity.value.trim();


        // ==================================
        // VALIDATION
        // ==================================

        if (!productNameValue) {

            alert(
                "Please enter product name."
            );

            productName.focus();

            return;
        }


        if (!categoryValue) {

            alert(
                "Please select product category."
            );

            category.focus();

            return;
        }


        if (!descriptionValue) {

            alert(
                "Please enter product description."
            );

            description.focus();

            return;
        }


        if (
            !priceValue ||
            Number(priceValue) < 0
        ) {

            alert(
                "Please enter a valid price."
            );

            price.focus();

            return;
        }


        if (
            !quantityValue ||
            Number(quantityValue) < 0
        ) {

            alert(
                "Please enter a valid quantity."
            );

            quantity.focus();

            return;
        }


        // ==================================
        // DISABLE BUTTON
        // ==================================

        submitBtn.disabled = true;

        submitBtn.textContent =
            editingProductId
                ? "Updating..."
                : "Adding...";


        try {

            // ==================================
            // UPDATE EXISTING PRODUCT
            // ==================================

            if (editingProductId) {

                const productRef =
                    doc(
                        db,
                        "products",
                        editingProductId
                    );


                await updateDoc(
                    productRef,
                    {

                        productName:
                            productNameValue,

                        category:
                            categoryValue,

                        description:
                            descriptionValue,

                        price:
                            priceValue,

                        quantity:
                            quantityValue,

                        updatedAt:
                            serverTimestamp()

                    }
                );


                alert(
                    "Product updated successfully!"
                );

            }


            // ==================================
            // ADD NEW PRODUCT
            // ==================================

            else {

                await addDoc(
                    collection(
                        db,
                        "products"
                    ),
                    {

                        productName:
                            productNameValue,

                        category:
                            categoryValue,

                        description:
                            descriptionValue,

                        price:
                            priceValue,

                        quantity:
                            quantityValue,


                        // OWNER

                        userId:
                            currentUser.uid,

                        ownerEmail:
                            currentUser.email || "",


                        // TIME

                        createdAt:
                            serverTimestamp()

                    }
                );


                alert(
                    "Product added successfully!"
                );

            }


            // ==================================
            // RESET
            // ==================================

            closeProductForm();


            await loadProducts(
                currentUser.uid
            );

        }

        catch (error) {

            console.error(
                "Product save error:",
                error
            );


            alert(
                "Error saving product:\n" +
                error.message
            );

        }


        finally {

            submitBtn.disabled =
                false;


            if (!editingProductId) {

                submitBtn.textContent =
                    "➕ Add Product";

            }

        }

    }
);


// ==========================================
// EDIT PRODUCT
// ==========================================

window.editProduct =
async function (productId) {

    try {

        const productRef =
            doc(
                db,
                "products",
                productId
            );


        const productSnapshot =
            await getDoc(
                productRef
            );


        if (
            !productSnapshot.exists()
        ) {

            alert(
                "Product not found."
            );

            return;
        }


        const data =
            productSnapshot.data();


        // ==================================
        // CHECK OWNER
        // ==================================

        if (
            data.userId !==
            currentUser.uid
        ) {

            alert(
                "You cannot edit this product."
            );

            return;
        }


        // ==================================
        // SET FORM VALUES
        // ==================================

        productName.value =
            data.productName || "";


        category.value =
            data.category || "";


        description.value =
            data.description || "";


        price.value =
            data.price || "";


        quantity.value =
            data.quantity || "";


        // ==================================
        // EDIT MODE
        // ==================================

        editingProductId =
            productId;


        submitBtn.textContent =
            "💾 Update Product";


        // ==================================
        // OPEN FORM
        // ==================================

        openProductForm();

    }

    catch (error) {

        console.error(
            "Edit product error:",
            error
        );


        alert(
            "Unable to edit product."
        );

    }

};


// ==========================================
// DELETE PRODUCT
// ==========================================

window.deleteProduct =
async function (productId) {

    try {

        const confirmDelete =
            confirm(
                "Are you sure you want to delete this product?"
            );


        if (!confirmDelete) {

            return;

        }


        const productRef =
            doc(
                db,
                "products",
                productId
            );


        const productSnapshot =
            await getDoc(
                productRef
            );


        if (
            !productSnapshot.exists()
        ) {

            alert(
                "Product not found."
            );

            return;
        }


        const data =
            productSnapshot.data();


        // ==================================
        // CHECK OWNER
        // ==================================

        if (
            data.userId !==
            currentUser.uid
        ) {

            alert(
                "You cannot delete this product."
            );

            return;
        }


        // ==================================
        // DELETE
        // ==================================

        await deleteDoc(
            productRef
        );


        alert(
            "Product deleted successfully!"
        );


        // ==================================
        // RELOAD
        // ==================================

        await loadProducts(
            currentUser.uid
        );

    }

    catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        alert(
            "Unable to delete product:\n" +
            error.message
        );

    }

};


// ==========================================
// HTML SAFETY
// ==========================================

function escapeHTML(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}