// =====================================================
// FABBRIDGE - POST REQUIREMENT
// Category-based requirement posting with subcategory support
// =====================================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getSubcategoriesForCategory } from "./categories.js";

const form = document.getElementById("requirementForm");
const categorySelect = document.getElementById("category");
const subcategorySelect = document.getElementById("subcategory");
const subHelperText = document.getElementById("subHelperText");
const submitBtn = document.getElementById("submitBtn");

let isSubmitting = false;

// =====================================================
// DYNAMIC SUBCATEGORY POPULATION
// =====================================================

function updateSubcategories(selectedCategory) {
    if (!subcategorySelect) return;

    // Reset subcategory selection when category changes
    subcategorySelect.innerHTML = "";

    if (!selectedCategory) {
        subcategorySelect.disabled = true;
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Category First";
        subcategorySelect.appendChild(defaultOption);
        if (subHelperText) subHelperText.textContent = "(Select category first)";
        return;
    }

    const subcategories = getSubcategoriesForCategory(selectedCategory);

    // Default prompt option
    const promptOption = document.createElement("option");
    promptOption.value = "";
    promptOption.textContent = "Select Subcategory (Optional)";
    subcategorySelect.appendChild(promptOption);

    if (subcategories && subcategories.length > 0) {
        subcategories.forEach((sub) => {
            const opt = document.createElement("option");
            opt.value = sub;
            opt.textContent = sub;
            subcategorySelect.appendChild(opt);
        });
        subcategorySelect.disabled = false;
        if (subHelperText) subHelperText.textContent = `(${subcategories.length} available)`;
    } else {
        // Fallback option
        const opt = document.createElement("option");
        opt.value = "Other";
        opt.textContent = "Other";
        subcategorySelect.appendChild(opt);
        subcategorySelect.disabled = false;
        if (subHelperText) subHelperText.textContent = "(Optional)";
    }
}

if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
        updateSubcategories(e.target.value);
    });
}

// =====================================================
// AUTHENTICATION & FORM SUBMISSION
// =====================================================

onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Please login first!");
        window.location.replace("login.html");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        const title = document.getElementById("title").value.trim();
        const category = categorySelect.value.trim();
        const subcategory = subcategorySelect ? subcategorySelect.value.trim() : "";
        const description = document.getElementById("description").value.trim();
        const quantity = document.getElementById("quantity").value.trim();
        const budget = document.getElementById("budget").value.trim();
        const deadline = document.getElementById("deadline").value.trim();

        // Validation
        if (!title || !category || !description || !quantity || !budget || !deadline) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Posting Requirement...";
            }

            const requirementPayload = {
                userId: user.uid,
                customerEmail: user.email || "",
                title,
                category,
                subcategory: subcategory || "",
                description,
                quantity,
                budget,
                deadline,
                status: "Pending",
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "requirements"), requirementPayload);

            alert("Requirement Posted Successfully!");

            form.reset();
            updateSubcategories("");

            window.location.href = "projects.html";
        } catch (error) {
            console.error("Error posting requirement:", error);
            alert("Failed to post requirement: " + error.message);
        } finally {
            isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Requirement";
            }
        }
    });
});

// Prevent back button from showing protected page after logout
window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        onAuthStateChanged(auth, (user) => {
            if (!user) window.location.replace("login.html");
        });
    }
});
