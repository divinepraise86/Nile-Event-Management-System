const uploadBox = document.getElementById("uploadBox");
const fileInput = document.getElementById("fileInput");
const uploadText = document.getElementById("uploadText");
const uploadInfo = document.getElementById("uploadInfo");
const uploadIcon = document.getElementById("uploadIcon"); 
const preview = document.getElementById("preview");

// Click → open file picker
uploadBox.addEventListener("click", () => {
    fileInput.click();
});

// File selected
fileInput.addEventListener("change", handleFile);

// Drag over
uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#3b82f6";
});

// Drag leave
uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "#ddd";
});

// Drop file
uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#06359a";

    const file = e.dataTransfer.files[0];
    handleFile({ target: { files: [file] } });
});

// Handle file
function handleFile(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed!");
        return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert("File is too large (max 5MB)");
        return;
    }

    // Show file name
    uploadInfo.textContent = file.name;

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = "block";

    // Optional: hide the icon and text
    uploadIcon.style.display = "none";
    uploadText.style.display = "none";
};
    reader.readAsDataURL(file);
}
