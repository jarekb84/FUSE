(function () {
    const selectors = {
        playerInfo: 'fusePlayerInfo',
        showSettingsBtn: 'fuseShowSettings',
        settingPanel: {
            name: 'fuseSettingsPanel',
            tabs: 'fuseSettingsPanel__tabs',
            borisChen: 'fuseSettingsPanel__tabs__borisChen',
            subvertADown: 'fuseSettingsPanel__tabs__subvertADown',
            csv: 'fuseSettingsPanel__tabs__csv'
        },
        localStorage: 'fuseStorage'
    }

    runAutoUpdate();

    function updatePlayerInfo() {
        const spans = document.querySelectorAll(`.${selectors.playerInfo}`);

        spans.forEach(span => {
            span.remove();
        });

        const data = getStoredData().data;

        if (window.location.host === 'fantasy.espn.com') {
            updateESPNPlayerInfo();
        }

        if (window.location.host === 'football.fantasysports.yahoo.com') {
            updateYahooPlayerInfo();
        }

        if (window.location.host === 'fantasy.nfl.com') {
            updateNFLPlayerInfo();
        }

        if (window.location.host === 'sleeper.com') {
            updateSleeperPlayerInfo();
        }

        function updateESPNPlayerInfo() {
            document.querySelectorAll('.player-column__bio .AnchorLink.link').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, '.player-column__bio', '.player-column__position');
            });
        }

        function updateYahooPlayerInfo() {
            document.querySelectorAll('.ysf-player-name a').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, 'td', '.ysf-player-detail', { fontWeight: '700' });
            });
        }

        function updateNFLPlayerInfo() {
            document.querySelectorAll('.playerName').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, '.playerNameAndInfo', 'em', { fontWeight: '900' });
            });
        }

        function updateSleeperPlayerInfo() {
            // matchup page
            document.querySelectorAll('.matchup-player-item .player-name > div:first-child').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, '.player-name', '.player-pos', { fontWeight: '900' });
            });

            // team page
            document.querySelectorAll('.team-roster-item .player-name').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, '.cell-player-meta', '.game-schedule-live-description', { fontWeight: '900' });
            });

            // players page
            document.querySelectorAll('.player-meta-container .name').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, '.name-container', '.position', { fontWeight: '900' });
            });

            // trend page
            document.querySelectorAll('.trending-list-item .name').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, '.player-details', '.position', { fontWeight: '900' });
            });

            // scores page
            document.querySelectorAll('.scores-content .player-meta .name').forEach(playerNameEl => {
                insertFUSEPlayerInfo(playerNameEl, '.player-meta', '.position', { fontWeight: '900' });
            });
        }

        function insertFUSEPlayerInfo(playerNameEl, parentSelector, rowAfterPlayerNameSelector, styles) {
            const name = playerNameEl.innerText;
            const info = constructPlayerInfo(name);

            if (info) {
                const fuseInfo = createPlayerInfoElement(info, styles);

                const parentElement = playerNameEl.closest(parentSelector);
                const rowAfterPlayerName = parentElement?.querySelector(rowAfterPlayerNameSelector);

                if (rowAfterPlayerName) {
                    rowAfterPlayerName.insertBefore(fuseInfo, rowAfterPlayerName.firstChild);
                } else {
                    playerNameEl.after(fuseInfo);
                }
            }
        }

        function constructPlayerInfo(name) {
            let info = [];

            if (!name) {
                return '';
            }

            const playerName = name.replace(' D/ST', '')

            const borisChenTier = data.borisChen.parsed[playerName];
            const subvertADownValue = data.subvertADown.parsed[playerName];
            const csvValue = data.csv.parsed[playerName];

            if (borisChenTier) {
                info.push(`${data.borisChen.prefix || ''}${borisChenTier}`)
            }
            if (subvertADownValue) {
                info.push(`${data.subvertADown.prefix || ''}${subvertADownValue}`)
            }

            if (csvValue) {
                info.push(`${data.csv.prefix || ''}${csvValue}`)
            }

            return info.join('/');
        }

        function createPlayerInfoElement(info, { marginLeft = '0', marginRight = '2px', fontWeight = '900' } = {}) {
            const span = document.createElement('span');
            span.className = selectors.playerInfo;
            span.style.marginRight = marginRight;
            span.style.marginLeft = marginLeft;
            span.style.fontWeight = fontWeight;
            span.textContent = info;

            return span;
        }
    }

    makePageButton(selectors.showSettingsBtn, '⚙', 175, editSettings);

    function editSettings() {
        if (document.getElementById(selectors.settingPanel.name)) {
            hideSettings();

            return;
        }

        let settingsPanel = createMainSettingsPanel();
        const savedData = getStoredData().data

        const borisChenTab = createBorisChenTab(savedData.borisChen)

        const toggleBorisChenTab = makeButton('BorisChen', () => {
            toggleTabs(borisChenTab.id)
        });

        const subvertADownTab = createSubvertADownTab(savedData.subvertADown);
        const toggleSubvertADownTab = makeButton('SubvertADown', () => {
            toggleTabs(subvertADownTab.id)
        });

        const csvTab = createCSVTab(savedData.csv);
        const toggleCsv = makeButton('CSV', () => {
            toggleTabs(csvTab.id)
        });
        settingsPanel.appendChild(toggleBorisChenTab);
        settingsPanel.appendChild(toggleSubvertADownTab);
        settingsPanel.appendChild(toggleCsv);
        settingsPanel.appendChild(borisChenTab);
        settingsPanel.appendChild(subvertADownTab);
        settingsPanel.appendChild(csvTab);

        const saveBtn = makeButton('Save', () => {
            let state = getStoredData();

            state.data.borisChen = { ...state.data.borisChen, ...getBorischenFormData() };
            state.data.borisChen.parsed = parseBorischenRawData(state.data.borisChen.raw);

            state.data.subvertADown = { ...state.data.borisChen, ...getSubvertADownFormData() };
            state.data.subvertADown.parsed = parseSubvertADownFormRawData(state.data.subvertADown.raw);

            state.data.csv = { ...state.data.csv, ...getCSVFormData() };
            state.data.csv.parsed = parseCSVFormData(state.data.csv.raw);

            saveToLocalStorage(state);
            hideSettings();
            updatePlayerInfo();
        });

        settingsPanel.appendChild(saveBtn);
        settingsPanel.appendChild(makeButton('Hide', hideSettings));

        document.body.insertBefore(settingsPanel, document.getElementById(selectors.showSettingsBtn).nextSibling);
        toggleTabs(borisChenTab.id);

        function createMainSettingsPanel() {
            const settingsPanel = document.createElement('div');

            settingsPanel.setAttribute('id', selectors.settingPanel.name);
            settingsPanel.style.position = 'fixed';
            settingsPanel.style.top = '200px';
            settingsPanel.style.right = '0';
            settingsPanel.style.backgroundColor = '#f9f9f9';
            settingsPanel.style.width = '400px';
            settingsPanel.style.padding = '10px';
            settingsPanel.style.zIndex = '1000';
            settingsPanel.style.textAlign = 'left';

            settingsPanel.style.padding = '15px';
            settingsPanel.style.border = '1px solid #ccc';
            settingsPanel.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.1)';

            return settingsPanel
        }

        function createBorisChenTab(savedData) {
            const tab = makeTabElement(
                selectors.settingPanel.borisChen,
                "To get the tier data from www.borisChen.co for your league's point values and paste the raw tier info into the below text areas."
            );

            const prefixField = makeInputField(
                'Prefix (optional)',
                `${selectors.settingPanel.borisChen}_prefix`,
                'Ex: BC',
                savedData.prefix,
            );

            tab.appendChild(prefixField);

            const positions = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST', 'K'];

            for (const position of positions) {
                const positionField = makeTextAreaField(
                    position,
                    `${selectors.settingPanel.borisChen}_${position}`,
                    savedData.raw[position],
                );

                tab.appendChild(positionField);
            }

            return tab;
        }

        function getBorischenFormData() {
            const data = {
                raw: {},
                prefix: document.getElementById(`${selectors.settingPanel.borisChen}_prefix`).value
            };

            const positions = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST', 'K'];

            for (const position of positions) {
                data.raw[position] = document.getElementById(`${selectors.settingPanel.borisChen}_${position}`).value;
            }

            return data;
        }

        function parseBorischenRawData(rawTierData) {
            const players = {};

            parseTierInfo(rawTierData.QB, players);
            parseTierInfo(rawTierData.RB, players);
            parseTierInfo(rawTierData.WR, players);
            parseTierInfo(rawTierData.TE, players);
            parseTierInfo(rawTierData.FLEX, players);
            parseTierInfo(splitUpDSTByPlatform(rawTierData.DST), players);
            parseTierInfo(rawTierData.K, players);

            return players;

            function parseTierInfo(raw, playerDictionary) {
                if (!raw) {
                    return
                }

                const tiers = raw.split('\n');

                tiers.forEach(tierRow => {
                    const row = tierRow.split(': ');
                    const tier = row[0].replace('Tier ', '');
                    const players = row[1];

                    players?.split(', ').forEach((player, index) => {
                        addPlayerInfoToDictionary(player, `${tier}.${index + 1}`, playerDictionary);
                    });
                });

                return playerDictionary;
            }

            function splitUpDSTByPlatform(raw) {
                if (!raw) {
                    return;
                }

                const tiers = raw.split('\n');
                const output = [];

                tiers.forEach(tierRow => {
                    const row = tierRow.split(': ');
                    const tier = row[0];
                    const teams = row[1];
                    let rowOutput = `${tier}: `;

                    teams?.split(', ').forEach((team, index) => {
                        const parts = team.split(' ');

                        // Team name is the last word
                        const teamName = parts.pop();

                        // Everything else is considered as the city
                        const city = parts.join(' ');

                        if (index !== 0) {
                            rowOutput += `, `;
                        }

                        rowOutput += `${teamName}`;

                        // add city back in as a separate entry for Yahoo
                        rowOutput += `, ${city}`;

                        // add full city and team name back in as a separate entry for NFL.com
                        rowOutput += `, ${team}`;
                    });

                    output.push(rowOutput);
                });

                return output.join('\n');
            }
        }

        function createSubvertADownTab(savedData) {
            const tab = makeTabElement(
                selectors.settingPanel.subvertADown,
                "Copy data from https://subvertadown.com and paste the raw tier info into the below text areas."
            );

            const prefixField = makeInputField(
                'Prefix (optional)',
                `${selectors.settingPanel.subvertADown}_prefix`,
                'Ex: SD',
                savedData.prefix,
            );

            tab.appendChild(prefixField);

            const positions = ['DST', 'QB', 'K'];

            for (const position of positions) {
                const positionField = makeTextAreaField(
                    position,
                    `${selectors.settingPanel.subvertADown}_${position}`,
                    savedData.raw[position],
                );

                tab.appendChild(positionField);
            }

            return tab;
        }

        function getSubvertADownFormData() {
            const data = {
                raw: {},
                prefix: document.getElementById(`${selectors.settingPanel.subvertADown}_prefix`).value
            };

            const positions = ['QB', 'DST', 'K'];

            for (const position of positions) {
                data.raw[position] = document.getElementById(`${selectors.settingPanel.subvertADown}_${position}`).value;
            }

            return data;
        }

        function parseSubvertADownFormRawData(rawData) {
            const players = {};

            processData(rawData.DST, players, true);
            processData(rawData.QB, players);
            processData(rawData.K, players);

            return players;

            function processData(input, players, isDST) {
                const lines = input.trim().split('\n');

                let player = '';
                lines.forEach(line => {
                    // skip blank lines
                    if (!line.trim()) {
                        return;
                    }

                    if (!player) {
                        // first line is player, next line is the value
                        player = line.split('|')[0].trim();

                        if (isDST) {
                            player = `${player}`;
                        }
                    } else {
                        addPlayerInfoToDictionary(player, line.trim(), players);

                        // reset for next iteration
                        player = ''
                    }
                })

                return players;
            }
        }

        function createCSVTab(savedData) {
            const tab = makeTabElement(
                selectors.settingPanel.csv,
                "Paste in your own comma separated value contents. First column should be the player's name."
            );

            const prefixField = makeInputField(
                'Prefix (optional)',
                `${selectors.settingPanel.csv}_prefix`,
                'Ex: C',
                savedData.prefix,
            );

            tab.appendChild(prefixField);

            const positionField = makeTextAreaField(
                'Custom',
                `${selectors.settingPanel.csv}_custom`,
                savedData.raw['custom'],
                { height: '200px', placeholder: 'Patrick Mahomes, Regress to mean' }
            );

            tab.appendChild(positionField);

            return tab;
        }

        function getCSVFormData() {
            const data = {
                raw: {},
                prefix: document.getElementById(`${selectors.settingPanel.csv}_prefix`).value
            };

            data.raw['custom'] = document.getElementById(`${selectors.settingPanel.csv}_custom`).value;

            return data;
        }

        function parseCSVFormData(rawData) {
            const players = {};
            const lines = rawData.custom.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length === 0) continue;

                const [player, ...rest] = line.split(',');

                addPlayerInfoToDictionary(player, rest.join(',').trim(), players);
            }

            return players;
        }

        function addPlayerInfoToDictionary(player, newInfo, playerDictionary) {
            let infoToSave = playerDictionary[player]

            if (infoToSave) {
                infoToSave += `|${newInfo}`;
            } else {
                infoToSave = newInfo;
            }

            playerDictionary[player] = infoToSave;

            const [first, ...rest] = player.split(' ');

            // Some sites truncate player names on some, but not all pages
            // ie Christian McCaffrey is sometimes shown as C. McCaffrey
            // storing both the long and short name allows the playerDictionary lookup
            // to work on all pages

            const shortName = `${first[0]}. ${rest.join(' ')}`
            playerDictionary[shortName] = infoToSave;

            // Sleeper shows Christian McCaffrey as C McCaffrey
            const shortNameWithoutPeriod = `${first[0]} ${rest.join(' ')}`
            playerDictionary[shortNameWithoutPeriod] = infoToSave;

            return playerDictionary
        }

        function hideAllTabs() {
            const tabs = document.querySelectorAll(`.${selectors.settingPanel.tabs}`);

            tabs.forEach(tab => {
                tab.style.display = 'none';
            });
        };

        function showTab(tabId) {
            var element = document.getElementById(tabId);
            element.style.display = 'block';
        }

        function toggleTabs(tabId) {
            hideAllTabs();
            showTab(tabId);
        }
    }

    function hideSettings() {
        document.body.removeChild(document.getElementById(selectors.settingPanel.name));
    }

    function getStoredData() {
        const storedData = localStorage.getItem(selectors.localStorage);
        const parsedData = JSON.parse(storedData) || {};

        let defaults = {
            data: {
                borisChen: {
                    raw: {},
                    parsed: {}
                },
                subvertADown: {
                    raw: {},
                    parsed: {}
                },
                csv: {
                    raw: {},
                    parsed: {}
                }
            }
        };

        const result = mergeDeep(defaults, parsedData)

        console.log(result)

        return result;
    }

    function saveToLocalStorage(data) {
        localStorage.setItem(selectors.localStorage, JSON.stringify(data));
    }

    function isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    // copy pasta from https://stackoverflow.com/a/34749873/276681
    // didn't want to pull in lodash just yet
    function mergeDeep(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (isObject(target) && isObject(source)) {
            for (const key in source) {
                if (isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return mergeDeep(target, ...sources);
    }

    function makePageButton(id, text, offset, onClick) {
        const existingBtn = document.getElementById(id);

        if (document.contains(existingBtn)) {
            existingBtn.remove();
        }

        const button = makeButton(text, onClick);
        button.id = id;

        button.style.position = 'fixed';
        button.style.top = `${offset}px`;
        button.style.right = 0;
        button.style.color = 'green';
        button.style['z-index'] = '10000';
        button.style.fontSize = '16px';
        button.style.padding = '1px 6px';
        button.style.marginRight = '0';

        const body = document.getElementsByTagName('body')[0];

        body.appendChild(button);

        return button;
    }

    function makeButton(text, onClick) {
        const button = document.createElement('button');

        button.innerHTML = text;
        button.style.padding = '5px';
        button.style.marginRight = '5px';
        button.style.backgroundColor = 'lightgray';
        button.style.border = '1px solid black';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.addEventListener('click', onClick);

        return button;
    }

    function makeTabElement(id, content) {
        const tab = document.createElement('div');
        tab.id = id;
        tab.className = selectors.settingPanel.tabs;
        tab.style.padding = '10px';

        const helpText = document.createElement('p');
        helpText.textContent = content;
        helpText.style.marginBottom = '10px';

        tab.appendChild(helpText);

        return tab;
    }

    function makeLabelElement(text) {
        const label = document.createElement('label');
        label.textContent = text;
        label.style.display = 'block';

        return label;
    }

    function makeInputField(labelText, id, placeholder, value,) {
        const field = document.createElement('div');
        const label = makeLabelElement(labelText)

        const input = document.createElement('input');
        input.id = id;
        input.placeholder = placeholder;
        input.value = value || '';
        input.style.marginBottom = '10px';
        input.style.backgroundColor = 'white';
        input.style.border = '1px solid black';
        input.style.padding = '3px';

        field.appendChild(label);
        field.appendChild(input);

        return field;
    }

    function makeTextAreaField(labelText, id, value = '', { width = '350px', height = '60px', placeholder = '' } = {}) {
        const field = document.createElement('div');
        const label = makeLabelElement(labelText);

        const textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.value = value;
        textarea.style.width = width;
        textarea.style.height = height;
        textarea.style.marginBottom = '10px';
        textarea.style.backgroundColor = 'white';
        textarea.style.border = '1px solid black';
        textarea.style.padding = '3px';
        textarea.placeholder = placeholder;

        field.appendChild(label);
        field.appendChild(textarea);

        return field;
    }

    function runAutoUpdate() {

        if (window.fuse?.autoUpdateObserver) {
            window.fuse.autoUpdateObserver.disconnect();
        } else {
            window.fuse = {};
        }

        // Update player info whenever the user causes the page content to update
        // ie when applying position filters on the free agents page
        const observer = new MutationObserver(function () {
            // pause mutation checks while FUSE updates the page
            // avoids an infinite loop of updates
            observer.disconnect();

            updatePlayerInfo();

            // resume monitoring for mutations
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        window.fuse.autoUpdateObserver = observer;
    }
}
)();