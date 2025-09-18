document.addEventListener("DOMContentLoaded", () => {
const refsContainer = document.querySelector("#refs");
const entries = Array.from(refsContainer.querySelectorAll("div.csl-entry"));

// Extract year + type from each entry
const grouped = {};
entries.forEach(entry => {
    const text = entry.innerText;

    // Find year (first 4-digit number, fallback to "Unknown")
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : "Unknown";

    // Determine type (very naive, could refine if needed)
    let type = "Other";
    if (text.toLowerCase().includes("preprint") || text.toLowerCase().includes("biorxiv")) type = "Preprint";
    else if (text.toLowerCase().includes("conference")) type = "Conference";
    else if (text.toLowerCase().includes("journal")) type = "Journal Article";
    else if (text.toLowerCase().includes("bioinformatics advances") ||
            text.toLowerCase().includes("plos")) type = "Journal Article";

    // Add entry to grouped dict
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][type]) grouped[year][type] = [];
    grouped[year][type].push(entry);
});

// Clear the original refs
refsContainer.innerHTML = "";

// Sort years descending
const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

years.forEach(year => {
    const yearHeader = document.createElement("h2");
    yearHeader.textContent = year;
    refsContainer.appendChild(yearHeader);

    Object.keys(grouped[year]).forEach(type => {
    const typeHeader = document.createElement("h3");
    typeHeader.textContent = type;
    refsContainer.appendChild(typeHeader);

    grouped[year][type].forEach(entry => {
        refsContainer.appendChild(entry);
    });
    });
});

// Helper function to download citation files
function downloadCitation(doi, format, filename) {
    const url = `https://api.crossref.org/works/${doi}/transform/${format}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const blob = new Blob([data], { type: 'text/plain' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        })
        .catch(error => {
            console.error('Error downloading citation:', error);
            // Fallback: open in new tab
            window.open(url, '_blank');
        });
}

// --- Button logic with improved DOI detection ---
const allEntries = document.querySelectorAll("#refs > div.csl-entry");
allEntries.forEach(entry => {
    // Remove [Internet] tags from the citation text
    entry.innerHTML = entry.innerHTML.replace(/\s\[(Internet|Online|Web|Print)\]/g, '');
    entry.innerHTML = entry.innerHTML.replace(/Available\sfrom\:\s/g, '');

    // Make name bold in the author list
    entry.innerHTML = entry.innerHTML.replace(/\bAnderson O\b/g, '<strong>Anderson O*</strong>');

    // Make journal names italic (pattern: ". Journal Name. Year")
    entry.innerHTML = entry.innerHTML.replace(/\.\s([A-Z][^.]*?)\.\s(\d{4})/g, '. <em>$1</em>. $2');

    let doi = null;
    
    // Get both HTML and text content for searching
    const htmlContent = entry.innerHTML;
    const textContent = entry.innerText;
    
    // Method 1: Look for DOI URLs in links
    const doiUrlMatch = htmlContent.match(/https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
    if (doiUrlMatch) {
        doi = doiUrlMatch[1];
    }
    
    // Method 2: Look for bare DOI in text content
    if (!doi) {
        const bareDoiMatch = textContent.match(/\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i);
        if (bareDoiMatch) {
            doi = bareDoiMatch[1];
        }
    }
    
    // Method 3: Look for "doi:" pattern in text
    if (!doi) {
        const doiColonMatch = textContent.match(/doi:\s*(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
        if (doiColonMatch) {
            doi = doiColonMatch[1];
        }
    }

    const doiUrl = doi ? `https://doi.org/${doi}` : null;
    const link = entry.querySelector("a[href]")?.getAttribute("href");
    const url = doiUrl || link;

    const btns = document.createElement("div");
    btns.classList.add("pub-buttons");

    if (url) {
        const journalBtn = document.createElement("a");
        journalBtn.href = url;
        journalBtn.target = "_blank";
        journalBtn.textContent = "Journal";
        btns.appendChild(journalBtn);

        if (doi) {
            const bibBtn = document.createElement("button");
            bibBtn.textContent = "BibTeX";
            bibBtn.onclick = (e) => {
                e.preventDefault();
                const filename = `citation_${doi.replace(/[\/\.]/g, '_')}.bib`;
                downloadCitation(doi, 'application/x-bibtex', filename);
            };
            btns.appendChild(bibBtn);

            const risBtn = document.createElement("button");
            risBtn.textContent = "RIS";
            risBtn.onclick = (e) => {
                e.preventDefault();
                const filename = `citation_${doi.replace(/[\/\.]/g, '_')}.ris`;
                downloadCitation(doi, 'application/x-research-info-systems', filename);
            };
            btns.appendChild(risBtn);
        }
    }

    entry.appendChild(btns);
});
});