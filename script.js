function revealElements() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - 50) { reveals[i].classList.add('active'); }
    }
}
window.addEventListener('scroll', revealElements);
window.addEventListener('load', revealElements);

const githubUser = 'hunggisagoner';
const repositories = ['MenuSplashText', 'GD-Physics', 'gdgpt']; 
const container = document.getElementById('mod-container');
const targetPlatforms = ['win', 'mac', 'android', 'ios'];
const platformIcons = { 'win': 'fa-windows', 'mac': 'fa-apple', 'android': 'fa-android', 'ios': 'fa-apple' };

let allModsData = []; 

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}

async function getGithubDownloads(user, repo) {
    try {
        const response = await fetch(`https://api.github.com/repos/${user}/${repo}/releases`);
        if (!response.ok) return "N/A";
        const releases = await response.json();
        
        let totalDownloads = 0;
        releases.forEach(release => {
            if (release.assets) {
                release.assets.forEach(asset => {
                    totalDownloads += asset.download_count;
                });
            }
        });
        return totalDownloads;
    } catch (error) {
        return "N/A";
    }
}

async function loadMods() {
    for (const repo of repositories) {
        try {
            let response = await fetch(`https://raw.githubusercontent.com/${githubUser}/${repo}/main/mod.json`);
            if (!response.ok) { response = await fetch(`https://raw.githubusercontent.com/${githubUser}/${repo}/master/mod.json`); }
            if (response.ok) {
                const data = await response.json();
                data.repoId = repo; 
                allModsData.push(data);
            }
        } catch (error) {}
    }
    populateFilters();
    renderMods(allModsData);
}

function initCustomSelect(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    const selectElm = wrapper.getElementsByTagName("select")[0];
    
    const existingSelected = wrapper.querySelector('.select-selected');
    if (existingSelected) { wrapper.removeChild(existingSelected); wrapper.removeChild(wrapper.querySelector('.select-items')); }

    const selectedDiv = document.createElement("DIV");
    selectedDiv.setAttribute("class", "select-selected");
    selectedDiv.innerHTML = selectElm.options[selectElm.selectedIndex].innerHTML;
    wrapper.appendChild(selectedDiv);
    
    const itemsDiv = document.createElement("DIV");
    itemsDiv.setAttribute("class", "select-items select-hide");
    
    for (let j = 0; j < selectElm.length; j++) {
        const optionDiv = document.createElement("DIV");
        optionDiv.innerHTML = selectElm.options[j].innerHTML;
        if (j === selectElm.selectedIndex) optionDiv.setAttribute("class", "same-as-selected");
        
        optionDiv.addEventListener("click", function(e) {
            const parentSelect = this.parentNode.parentNode.getElementsByTagName("select")[0];
            const triggerDiv = this.parentNode.previousSibling;
            for (let i = 0; i < parentSelect.length; i++) {
                if (parentSelect.options[i].innerHTML == this.innerHTML) {
                    parentSelect.selectedIndex = i;
                    triggerDiv.innerHTML = this.innerHTML;
                    const sameSelected = this.parentNode.getElementsByClassName("same-as-selected");
                    for (let k = 0; k < sameSelected.length; k++) { sameSelected[k].removeAttribute("class"); }
                    this.setAttribute("class", "same-as-selected");
                    break;
                }
            }
            triggerDiv.click();
            applyFilters();
        });
        itemsDiv.appendChild(optionDiv);
    }
    wrapper.appendChild(itemsDiv);
    
    selectedDiv.addEventListener("click", function(e) {
        e.stopPropagation();
        closeAllSelect(this);
        this.nextSibling.classList.toggle("select-hide");
        this.classList.toggle("select-arrow-active");
        
        const allWrappers = document.querySelectorAll('.custom-select-wrapper');
        allWrappers.forEach(w => w.style.zIndex = '1');
        if(!this.nextSibling.classList.contains('select-hide')) {
            this.parentNode.style.zIndex = '100';
        }
    });
}

function closeAllSelect(elmnt) {
    let x = document.getElementsByClassName("select-items");
    let y = document.getElementsByClassName("select-selected");
    let arrNo = [];
    for (let i = 0; i < y.length; i++) {
        if (elmnt == y[i]) { arrNo.push(i) } 
        else { y[i].classList.remove("select-arrow-active"); }
    }
    for (let i = 0; i < x.length; i++) {
        if (arrNo.indexOf(i) === -1) { 
            x[i].classList.add("select-hide"); 
            x[i].parentNode.style.zIndex = '1'; 
        }
    }
}
document.addEventListener("click", closeAllSelect);

function populateFilters() {
    const geodeSet = new Set();
    const tagSet = new Set();

    allModsData.forEach(mod => {
        if (mod.geode) geodeSet.add(mod.geode);
        if (mod.tags && Array.isArray(mod.tags)) { mod.tags.forEach(t => tagSet.add(t)); }
    });

    const geodeSelect = document.getElementById('filter-geode');
    geodeSelect.innerHTML = '<option value="all">All Versions</option>';
    geodeSet.forEach(ver => { geodeSelect.innerHTML += `<option value="${ver}">${ver}</option>`; });

    const tagSelect = document.getElementById('filter-tag');
    tagSelect.innerHTML = '<option value="all">All Tags</option>';
    tagSet.forEach(tag => { tagSelect.innerHTML += `<option value="${tag}">${tag}</option>`; });

    initCustomSelect('wrap-geode');
    initCustomSelect('wrap-platform');
    initCustomSelect('wrap-tag');
}

function applyFilters() {
    const geodeVal = document.getElementById('filter-geode').value;
    const platVal = document.getElementById('filter-platform').value;
    const tagVal = document.getElementById('filter-tag').value;

    const filtered = allModsData.filter(mod => {
        if (geodeVal !== 'all' && mod.geode !== geodeVal) return false;
        if (tagVal !== 'all') { if (!mod.tags || !mod.tags.includes(tagVal)) return false; }
        if (platVal !== 'all') {
            if (typeof mod.gd === 'string') { return true; } 
            else if (typeof mod.gd === 'object' && mod.gd !== null) { if (!mod.gd[platVal]) return false; } 
            else { return false; }
        }
        return true;
    });
    renderMods(filtered);
}

function showCyberModal(message = "Coming soon. Stay tuned!") {
    const overlay = document.getElementById('cyber-modal-overlay');
    const msgSpan = document.getElementById('modal-msg');
    
    msgSpan.innerText = message;
    overlay.classList.add('show');
}

document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    
    if (link) {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '') {
            e.preventDefault(); 
            showCyberModal();
        }
    }
});

const modalOkBtn = document.getElementById('modal-ok-btn');
if (modalOkBtn) {
    modalOkBtn.addEventListener('click', () => {
        document.getElementById('cyber-modal-overlay').classList.remove('show');
    });
}

function renderMods(modsArray) {
    container.innerHTML = '';
    
    if(modsArray.length === 0) {
        container.innerHTML = `<div class="loading-text" style="color:var(--muted);"><i class="fa-solid fa-triangle-exclamation"></i> NO PROJECTS MATCH THE CURRENT FILTERS.</div>`;
        return;
    }

    modsArray.forEach((data, index) => {
        const repoName = data.repoId;
        const modName = data.name || repoName;
        const description = data.description || "No description provided for this module.";
        const geodeVer = data.geode || "N/A";
        
        let gdHtml = '<div class="platform-grid">';
        if (typeof data.gd === 'object' && data.gd !== null) {
            targetPlatforms.forEach(platform => {
                const version = data.gd[platform];
                const icon = platformIcons[platform] || 'fa-desktop';
                if (version) {
                    gdHtml += `<span class="badge supported"><i class="fa-brands ${icon}"></i> ${platform}: ${version}</span>`;
                } else {
                    gdHtml += `<span class="badge unsupported"><i class="fa-brands ${icon}"></i> ${platform}: N/A</span>`;
                }
            });
        } else if (typeof data.gd === 'string') {
            gdHtml += `<span class="badge supported" style="grid-column: span 2;"><i class="fa-solid fa-gamepad"></i> ALL: ${data.gd}</span>`;
        } else {
            gdHtml += `<span class="badge unsupported" style="grid-column: span 2;"><i class="fa-solid fa-circle-question"></i> COMPATIBILITY UNKNOWN</span>`;
        }
        gdHtml += '</div>';

        let tagsHtml = '';
        if (data.tags && data.tags.length > 0) {
            tagsHtml += '<div class="project-tags">';
            data.tags.forEach(tag => { tagsHtml += `<span class="tag"><i class="fa-solid fa-tag"></i> ${tag.toLowerCase()}</span>`; });
            tagsHtml += '</div>';
        }

        const fallbackIcon = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236b7280'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>`;
        const logoUrl = `https://raw.githubusercontent.com/${githubUser}/${repoName}/main/logo.png`;

        const wrapper = document.createElement('div');
        wrapper.className = 'project-item reveal-on-scroll active'; 
        wrapper.style.transitionDelay = `${index * 0.1}s`; 
        
        wrapper.innerHTML = `
            <div class="project-bg-hover"></div>
            
            <div class="project-info">
                <div class="title-group">
                    <img src="${logoUrl}" class="mod-logo" alt="Logo" onerror="this.src='${fallbackIcon}'">
                    <div class="project-name">${modName}</div>
                </div>
                <div class="project-desc">${description}</div>
                ${tagsHtml}
                <div class="download-count">
                    Total Downloads: &nbsp;
                    <span id="dl-${repoName}" class="dl-number-wrapper">
                        <span class="dl-old"><i class="fa-solid fa-circle-notch fa-spin"></i></span>
                        <span class="dl-new">0</span>
                    </span>
                </div>
            </div>

            <div class="meta-data">
                <div class="meta-block">
                    <div class="meta-title">GEODE VERSION</div>
                    <div class="geode-badge"><i class="fa-solid fa-cube"></i> Geode ${geodeVer}</div>
                </div>
                <div class="meta-block">
                    <div class="meta-title">COMPATIBILITY</div>
                    ${gdHtml}
                </div>
                <div class="action-links">
                    <a href="https://github.com/${githubUser}/${repoName}" target="_blank" class="btn-action">
                        <i class="fa-solid fa-code"></i> Source Code
                    </a>
                    <a href="https://github.com/${githubUser}/${repoName}/releases/latest" target="_blank" class="btn-action">
                        <i class="fa-solid fa-download"></i> Download
                    </a>
                </div>
            </div>
        `;
        container.appendChild(wrapper);

        getGithubDownloads(githubUser, repoName).then(count => {
            const dlWrapper = document.getElementById(`dl-${repoName}`);
            if (dlWrapper) {
                const finalCount = (count === "N/A" || count === 0) ? "0" : formatNumber(parseInt(count));
                dlWrapper.querySelector('.dl-new').innerHTML = finalCount;
                
                setTimeout(() => {
                    dlWrapper.classList.add('animate-slide');
                }, 50);
            }
        });
    });
    
    setTimeout(revealElements, 100);
}

window.addEventListener('load', loadMods);