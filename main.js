// main.js - frontend behavior extracted from index.html
(function () {
    const queryInput = document.getElementById('query');
    const searchBtn = document.getElementById('searchBtn');
    const results = document.getElementById('results');

    // radio inputs for the glass radio group
    const radioInputs = Array.from(document.querySelectorAll('input[name="plan"]'));

    // Sidebar import elements
    const importArea = document.getElementById('importArea');
    const chooseFile = document.getElementById('chooseFile');
    const fileInput = document.getElementById('fileInput');
    const importBtn = document.getElementById('importBtn');
    const importStatus = document.getElementById('importStatus');

    // Wire radios (glass group) if present
    if (radioInputs.length) {
        radioInputs.forEach(radio => {
            radio.addEventListener('change', () => {
                // focus the query input after switching
                queryInput && queryInput.focus();
            });
        });

        // Keyboard shortcuts: Left/Right to switch radios but only when typing/focused in search or import area
        window.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            const active = document.activeElement;
            // only switch radios when focus is on the search input or the import textarea
            if (active === queryInput || active === importArea) {
                const idx = radioInputs.findIndex(r => r.checked);
                if (idx === -1) return;
                e.preventDefault();
                const next = (idx + (e.key === 'ArrowRight' ? 1 : radioInputs.length - 1)) % radioInputs.length;
                radioInputs[next].checked = true;
                radioInputs[next].dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    function getActiveMode() {
        // read from radios first (new glass group)
        if (radioInputs.length) {
            const checked = radioInputs.find(r => r.checked);
            if (!checked) return 'code';
            if (checked.id && checked.id.includes('silver')) return 'code';
            if (checked.id && checked.id.includes('gold')) return 'study';
            // fallback: use value or label text
            return 'code';
        }
        // fallback to previous button-based behavior if radios are not present
        const modes = Array.from(document.querySelectorAll('.mode'));
        const btn = modes.find(b => b.classList.contains('active'));
        return btn ? btn.dataset.mode : 'code';
    }

    function fakeSearchResults(mode, q) {
        const items = [];
        if (!q) return items;
        const base = q.split(' ').slice(0, 3).join(' ');
        if (mode === 'code') {
            items.push({ title: `${base} — Example snippet`, desc: 'Short code example and explanation.' });
            items.push({ title: `${base} — Repo & Walkthrough`, desc: 'A small repo or gist showing how to use it.' });
            items.push({ title: `${base} — Cheatsheet`, desc: 'Key functions, patterns and gotchas.' });
        } else {
            items.push({ title: `${base} — Study Guide`, desc: 'Summary, topics to cover, and exercises.' });
            items.push({ title: `${base} — Video Lecture`, desc: 'Short curated lecture or tutorial link.' });
            items.push({ title: `${base} — Practice Problems`, desc: 'Problems with increasing difficulty.' });
        }
        return items;
    }

    function performSearch() {
        const q = queryInput.value.trim();
        const mode = getActiveMode();
        results.innerHTML = '';
        results.classList.remove('show');

        // Show loader
        const loader = document.getElementById('loader');
        loader.style.display = 'flex';
        results.classList.add('show');

        setTimeout(() => {
            // Hide loader
            const loader = document.getElementById('loader');
            loader.style.display = 'none';

            results.innerHTML = '';
            const items = fakeSearchResults(mode, q);
            if (items.length === 0) {
                results.innerHTML = `<div class="empty">Please enter a search query to get results.</div>`;
                return;
            }
            items.forEach(it => {
                const card = document.createElement('article');
                card.className = 'result-card';
                card.innerHTML = `<h3>${it.title}</h3><p>${it.desc}</p>`;
                results.appendChild(card);
            });
        }, 600);
    }

    searchBtn.addEventListener('click', performSearch);
    queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    window.addEventListener('load', () => queryInput && queryInput.focus());

    // --- Collapsible sidebar handlers ---
    const collapseBtn = document.getElementById('collapseBtn');
    const appLayout = document.querySelector('.app-layout');
    const sidebar = document.querySelector('.sidebar');

    function applySidebarState(collapsed) {
        if (!appLayout || !sidebar || !collapseBtn) return;
        appLayout.classList.toggle('collapsed', collapsed);
        sidebar.classList.toggle('collapsed', collapsed);
        collapseBtn.textContent = collapsed ? '▶' : '◀';
        collapseBtn.setAttribute('aria-expanded', (!collapsed).toString());
        try { localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0'); } catch (e) { }

        // manage the reveal tab: create if needed and show/hide
        const tab = ensureSidebarTab();
        if (collapsed) {
            tab.classList.add('show');
            tab.setAttribute('aria-hidden', 'false');
        } else {
            tab.classList.remove('show');
            tab.setAttribute('aria-hidden', 'true');
        }
    }

    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const isCollapsed = appLayout.classList.contains('collapsed');
            applySidebarState(!isCollapsed);
        });
    }

    // create a small reveal tab button that appears when the sidebar is collapsed
    function ensureSidebarTab() {
        let tab = document.getElementById('sidebarTab');
        if (tab) return tab;
        tab = document.createElement('button');
        tab.id = 'sidebarTab';
        tab.className = 'sidebar-tab';
        tab.type = 'button';
        tab.title = 'Open sidebar';
        tab.innerHTML = '▶';
        tab.setAttribute('aria-hidden', 'true');
        tab.addEventListener('click', () => applySidebarState(false));
        document.body.appendChild(tab);
        return tab;
    }

    // Global keyboard handling for collapsing/opening the sidebar when focus is not in inputs
    window.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const active = document.activeElement;
        // if focus is in typing fields, don't toggle sidebar here (radio handler handles Radio switching)
        if (active === queryInput || active === importArea || (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'))) return;
        // ArrowLeft -> collapse, ArrowRight -> expand
        if (e.key === 'ArrowLeft') {
            applySidebarState(true);
        } else if (e.key === 'ArrowRight') {
            applySidebarState(false);
        }
    });

    // Ensure sidebar is visible by default.
    // If a previous session saved a collapsed state it can hide the left frame unexpectedly.
    // To guarantee the left frame appears, expand on load and reset the saved flag.
    try {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved === '1') {
            // reset stored collapsed state and expand
            localStorage.setItem('sidebarCollapsed', '0');
        }
    } catch (e) { }
    // Explicitly expand the sidebar on load
    applySidebarState(false);

    // --- Import area handlers ---
    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    chooseFile.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            importArea.value = reader.result;
            importStatus.textContent = `Loaded ${f.name}`;
            setTimeout(() => importStatus.textContent = '', 2500);
        };
        reader.readAsText(f);
    });

    // support drop onto textarea
    if (importArea) {
        importArea.addEventListener('dragover', (e) => { e.preventDefault(); importArea.classList.add('drag'); });
        importArea.addEventListener('dragleave', () => { importArea.classList.remove('drag'); });
        importArea.addEventListener('drop', (e) => {
            e.preventDefault(); importArea.classList.remove('drag');
            const f = e.dataTransfer.files && e.dataTransfer.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => { importArea.value = reader.result; importStatus.textContent = `Loaded ${f.name}`; setTimeout(() => importStatus.textContent = '', 2500); };
            reader.readAsText(f);
        });
    }

    // Expand left import frame to 70% and shrink right panel to 30% while editing/importing
    function setImportActive(active) {
        if (!appLayout) return;
        // when user is actively editing the import area, ensure the "import-active"
        // layout (70% left) is applied and remove any collapsed state
        appLayout.classList.toggle('import-active', active);
        if (active) appLayout.classList.remove('import-collapsed');
    }

    if (importArea) {
        // expand on focus
        importArea.addEventListener('focus', () => setImportActive(true));

        // keep expanded while there's content
        importArea.addEventListener('input', () => {
            const hasContent = !!importArea.value.trim();
            setImportActive(hasContent || document.activeElement === importArea);
        });

        // collapse on blur only if empty
        importArea.addEventListener('blur', () => {
            const hasContent = !!importArea.value.trim();
            setImportActive(hasContent);
        });
    }

    importBtn.addEventListener('click', () => {
        const code = importArea.value || '';
        if (!code.trim()) {
            importStatus.textContent = 'Please paste code or upload a file first.';
            setTimeout(() => importStatus.textContent = '', 2200);
            return;
        }
        // create a result card showing imported code with a remove button
        const card = document.createElement('article');
        card.className = 'result-card';

        const header = document.createElement('div');
        header.className = 'result-card-header';
        const title = document.createElement('h3');
        title.textContent = 'Imported Code';
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-import';
        removeBtn.textContent = 'Remove';
        header.appendChild(title);
        header.appendChild(removeBtn);

        const pre = document.createElement('pre');
        pre.className = 'imported-code';
        pre.innerHTML = escapeHtml(code);

        card.appendChild(header);
        card.appendChild(pre);

        // remove handler: remove card and restore layout if no more imported/result cards
        removeBtn.addEventListener('click', () => {
            card.remove();
            // if no more result-card elements remain, remove collapsed state
            const remaining = results.querySelectorAll('.result-card').length;
            if (remaining === 0 && appLayout) {
                appLayout.classList.remove('import-collapsed');
            }
        });

        results.insertAdjacentElement('afterbegin', card);
        results.classList.add('show');
        importStatus.textContent = 'Imported ✓';
        setTimeout(() => importStatus.textContent = '', 1800);

        // After importing, make the left import pane smaller so results are more visible
        if (appLayout) {
            appLayout.classList.remove('import-active');
            appLayout.classList.add('import-collapsed');
        }
    });

})();
