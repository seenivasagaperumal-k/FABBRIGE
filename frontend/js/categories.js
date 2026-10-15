// =====================================================
// FABBRIDGE - CATEGORIES DEFINITION & UTILITIES
// Central configuration for Manufacturing Categories and Subcategories
// =====================================================

export const MANUFACTURING_CATEGORIES = [
    {
        id: "cnc-machining",
        name: "CNC Machining",
        icon: "⚙️",
        image: "assets/categories/cnc-machining.svg",
        description: "Precision CNC milling, turning, and machined metal/plastic components",
        aliases: ["CNC Machining", "CNC", "Machining"],
        subcategories: [
            "CNC Parts",
            "Precision Metal Components",
            "Milling & Turning",
            "Multi-Axis Machining",
            "Other CNC Machining"
        ]
    },
    {
        id: "sheet-metal-fabrication",
        name: "Sheet Metal & Fabrication",
        icon: "🏗️",
        image: "assets/categories/sheet-metal.svg",
        description: "Laser cutting, sheet metal bending, frames, boxes, and structural fabrication",
        aliases: ["Sheet Metal & Fabrication", "Sheet Metal", "Fabrication"],
        subcategories: [
            "Metal Frames",
            "Sheet Metal Boxes",
            "Laser-Cut Parts",
            "Enclosures & Chassis",
            "Welding & Assembly",
            "Other Sheet Metal & Fabrication"
        ]
    },
    {
        id: "laser-cutting",
        name: "Laser Cutting",
        icon: "⚡",
        image: "assets/categories/laser-cutting.svg",
        description: "High-precision 2D/3D laser cutting for sheet metals, tubes, and acrylics",
        aliases: ["Laser Cutting"],
        subcategories: [
            "Sheet Metal Laser Cutting",
            "Tube & Pipe Laser Cutting",
            "Acrylic & Plastic Laser Cutting",
            "Laser-Cut Parts",
            "Other Laser Cutting"
        ]
    },
    {
        id: "injection-moulding",
        name: "Injection Moulding",
        icon: "🧱",
        image: "assets/categories/injection-moulding.svg",
        description: "Custom injection moulding, plastic components, and tooling dies",
        aliases: ["Injection Moulding", "Plastic Moulding", "Plastic", "Plastic Manufacturing"],
        subcategories: [
            "Injection-Moulded Parts",
            "Plastic Components",
            "Mould Tooling & Dies",
            "Blow Moulding",
            "Other Injection Moulding"
        ]
    },
    {
        id: "3d-printing",
        name: "3D Printing",
        icon: "🖨️",
        image: "assets/categories/3d-printing.svg",
        description: "Rapid prototyping, additive manufacturing, SLA, SLS, and functional parts",
        aliases: ["3D Printing", "Additive Manufacturing"],
        subcategories: [
            "Rapid Prototyping",
            "3D-Printed Parts",
            "Functional Prototyping",
            "Metal 3D Printing",
            "Other 3D Printing"
        ]
    },
    {
        id: "electronics",
        name: "Electronics",
        icon: "🔌",
        image: "assets/categories/electronics.svg",
        description: "Circuit boards, electronic components, consumer devices, and sub-assemblies",
        aliases: ["Electronics"],
        subcategories: [
            "Mobile Phones",
            "Laptops",
            "Televisions",
            "Electronic Components",
            "Circuit Boards",
            "Sensors & Modules",
            "Other Electronics"
        ]
    },
    {
        id: "electrical",
        name: "Electrical",
        icon: "💡",
        image: "assets/categories/electrical.svg",
        description: "Control panels, wiring harnesses, transformers, switchgear, and power units",
        aliases: ["Electrical"],
        subcategories: [
            "Control Panels",
            "Wiring Harnesses",
            "Transformers & Switchgear",
            "Power Supplies & Inverters",
            "Motors & Actuators",
            "Other Electrical"
        ]
    },
    {
        id: "mechanical-components",
        name: "Mechanical Components",
        icon: "🔩",
        image: "assets/categories/mechanical.svg",
        description: "Gears, shafts, valves, pumps, bearings, fasteners, and power transmission",
        aliases: ["Mechanical Components", "Mechanical"],
        subcategories: [
            "Gears & Shafts",
            "Fasteners & Hardware",
            "Valves & Pumps",
            "Bearings & Bushings",
            "Hydraulic & Pneumatic Parts",
            "Other Mechanical"
        ]
    },
    {
        id: "packaging",
        name: "Packaging",
        icon: "📦",
        image: "assets/categories/packaging.svg",
        description: "Corrugated boxes, custom crating, protective foam, and industrial packaging",
        aliases: ["Packaging"],
        subcategories: [
            "Corrugated Boxes",
            "Industrial Packaging",
            "Custom Crating & Foam",
            "Protective Packaging",
            "Other Packaging"
        ]
    },
    {
        id: "other-manufacturing",
        name: "Other Manufacturing",
        icon: "🏭",
        image: "assets/categories/other-manufacturing.svg",
        description: "Custom manufacturing, prototyping, assembly services, and general fabrication",
        aliases: ["Other Manufacturing", "Other", "General"],
        subcategories: [
            "Custom Manufacturing",
            "Prototyping",
            "Assembly Services",
            "Surface Finishing & Coating",
            "Other"
        ]
    }
];

/**
 * Find category definition by canonical name or alias (case-insensitive)
 */
export function getCategoryByNameOrAlias(name) {
    if (!name || typeof name !== "string") return null;
    const clean = name.trim().toLowerCase();
    for (const cat of MANUFACTURING_CATEGORIES) {
        if (cat.name.toLowerCase() === clean) return cat;
        if (cat.aliases && cat.aliases.some(a => a.toLowerCase() === clean)) return cat;
    }
    return null;
}

/**
 * Returns subcategory list for a given category name
 */
export function getSubcategoriesForCategory(categoryName) {
    const cat = getCategoryByNameOrAlias(categoryName);
    return cat ? cat.subcategories : [];
}

/**
 * Checks if a requirement category matches a target category (supports aliases)
 */
export function matchCategory(reqCategory, targetCategoryName) {
    if (!targetCategoryName || targetCategoryName === "all") return true;
    if (!reqCategory) return false;

    const targetCat = getCategoryByNameOrAlias(targetCategoryName);
    if (!targetCat) {
        return reqCategory.trim().toLowerCase() === targetCategoryName.trim().toLowerCase();
    }

    const reqCat = getCategoryByNameOrAlias(reqCategory);
    if (reqCat && reqCat.id === targetCat.id) return true;

    const cleanReq = reqCategory.trim().toLowerCase();
    return targetCat.aliases.some(a => a.toLowerCase() === cleanReq);
}

/**
 * Canonical display helper
 */
export function getCanonicalCategoryName(categoryName) {
    const cat = getCategoryByNameOrAlias(categoryName);
    return cat ? cat.name : (categoryName || "Uncategorized");
}

/**
 * Category icon helper
 */
export function getCategoryIcon(categoryName) {
    const cat = getCategoryByNameOrAlias(categoryName);
    return cat ? cat.icon : "🏷️";
}

/**
 * Category vector image helper
 */
export function getCategoryImage(categoryName) {
    const cat = getCategoryByNameOrAlias(categoryName);
    return cat && cat.image ? cat.image : "assets/categories/other-manufacturing.svg";
}
