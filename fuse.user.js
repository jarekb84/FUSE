// ==UserScript==
// @name        FUSE
// @namespace   https://github.com/jarekb84/FUSE
// @version     VERSION_PLACEHOLDER
// @author      Jerry Batorski
// @license     Apache-2.0
// @description FUSE (Fantasy User Stat Enhancer) easily integrates BorisChen tiers, SubvertADown streaming values, and your own data directly into your preferred fantasy platform to simplify roster selection, free agent scouting, and trade evaluations.
// @grant       GM.xmlHttpRequest
// @match       https://fantasy.espn.com/*
// @match       https://fantasy.nfl.com/*
// @match       https://football.fantasysports.yahoo.com/*
// @match       https://*.football.cbssports.com/*
// @match       https://sleeper.com/*
// ==/UserScript==

(async function () {
    const version = 'VERSION_PLACEHOLDER';

    const store = makeStoreModule();
    const ui = makeUIModule();
    const dom = makeDOMModule();
    const utils = makeUtilsModule();

    const settings = makeSettingsModule();
    const borisChen = makeBorisChenModule();
    const customData = makeCustomDataModule();
    const subvertADown = makeSubvertADownModule();
    const players = makePlayersModule();

    const DSTNames = players.getDSTNames();
    await borisChen.runBorisChenAutoUpdate();
    ui.autoInjectFUSEOnDOMChange();

    const showSettingsBtn = dom.makePageButton('fuseShowSettings', '⚙', 100, settings.editSettings);

    function makeUIModule() {
        const self = {
            autoInjectFUSEOnDOMChange,
            injectFUSEInfoIntoFantasySite,
            makeSelector,
            selectors: {
                playerInfo: 'fusePlayerInfo'
            }
        }

        return self;

        function makeSelector(idBase, attribute = 'value') {
            return {
                id: `${idBase}`,
                get: () => document.getElementById(`${idBase}`),
                getValue: function () {
                    return this.get() ? this.get()[attribute] : null;
                },
                setValue: function (value) {
                    return this.get().setAttribute(attribute, value);
                }
            };
        }

        function autoInjectFUSEOnDOMChange() {
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

                injectFUSEInfoIntoFantasySite();

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

        function injectFUSEInfoIntoFantasySite() {
            const spans = document.querySelectorAll(`.${self.selectors.playerInfo}`);

            spans.forEach(span => {
                span.remove();
            });

            const state = store.getState().data;

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

            if (window.location.host.includes('football.cbssports.com')) {
                updateCBSPlayerInfo();
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

            function updateCBSPlayerInfo() {
                document.querySelectorAll('.playerLink').forEach(playerNameEl => {
                    insertFUSEPlayerInfo(playerNameEl, 'td', 'playerPositionAndTeam', { fontWeight: '900', marginLeft: '2px' });
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

                const borisChenTier = state.borisChen.parsed[playerName];
                const subvertADownValue = state.subvertADown.parsed[playerName];
                const customDataValue = state.customData.parsed[playerName];

                if (borisChenTier) {
                    info.push(`${state.borisChen.prefix || ''}${borisChenTier}`)
                }
                if (subvertADownValue) {
                    info.push(`${state.subvertADown.prefix || ''}${subvertADownValue}`)
                }

                if (customDataValue) {
                    info.push(`${state.customData.prefix || ''}${customDataValue}`)
                }

                return info.join('/');
            }

            function createPlayerInfoElement(info, { marginLeft = '0', marginRight = '2px', fontWeight = '900' } = {}) {
                const span = document.createElement('span');
                span.className = self.selectors.playerInfo;
                span.style.marginRight = marginRight;
                span.style.marginLeft = marginLeft;
                span.style.fontWeight = fontWeight;
                span.textContent = info;

                return span;
            }
        }
    }
    function makeStoreModule() {
        const self = {
            getState,
            saveState,
            selectors: {
                localStorage: 'fuseStorage'
            }
        }

        return self;

        function getState() {
            const storedData = localStorage.getItem(self.selectors.localStorage);
            const parsedData = JSON.parse(storedData) || {};

            // TODO these defaults should come from the module definition
            let defaults = {
                data: {
                    borisChen: {
                        raw: {},
                        parsed: {},
                        scoring: 'Standard',
                        autoFetch: 'Daily',
                        lastFetched: ''
                    },
                    subvertADown: {
                        raw: {},
                        parsed: {}
                    },
                    customData: {
                        raw: {},
                        parsed: {},
                        delimiter: 'Tab',
                        playerColumn: 1,
                        displayColumn: 'All'
                    }
                }
            };

            const result = utils.mergeDeep(defaults, parsedData)

            console.log(result)

            return result;
        }

        function saveState(data) {
            localStorage.setItem(self.selectors.localStorage, JSON.stringify(data));
        }
    }

    function makePlayersModule() {
        return {
            addPlayerInfoToDictionary,
            getDSTNames
        }

        function addPlayerInfoToDictionary(player, newInfo, playerDictionary) {
            const playerName = player.replace(' III', '').replace(' II', '');
            let infoToSave = playerDictionary[playerName]

            if (infoToSave) {
                infoToSave += `|${newInfo}`;
            } else {
                infoToSave = newInfo;
            }

            const distNames = DSTNames[playerName] || [];

            if (distNames.length) {
                distNames.forEach(distName => {
                    playerDictionary[distName] = infoToSave;
                });

                return playerDictionary;
            }

            playerDictionary[playerName] = infoToSave;
            playerDictionary[player] = infoToSave; // some sites do use the II/III name

            const [first, ...rest] = playerName.split(' ');

            // Some sites truncate player names on some, but not all pages
            // ie Christian McCaffrey is sometimes shown as C. McCaffrey
            // storing both the long and short name allows the playerDictionary lookup
            // to work on all pages

            const shortName = `${first[0]}. ${rest.join(' ')}`
            playerDictionary[shortName] = infoToSave;

            // Sleeper shows Christian McCaffrey as C McCaffrey
            const shortNameWithoutPeriod = `${first[0]} ${rest.join(' ')}`
            playerDictionary[shortNameWithoutPeriod] = infoToSave;

            return playerDictionary;
        }

        function getDSTNames() {
            const teamNames = {
                '49ers': ['49ers', 'San Francisco', 'San Francisco 49ers', 'San Francisco. 49ers', 'SF'],
                'Bears': ['Bears', 'Chicago', 'Chicago Bears', 'Chicago. Bears', 'CHI'],
                'Bengals': ['Bengals', 'Cincinnati', 'Cincinnati Bengals', 'Cincinnati. Bengals', 'CIN'],
                'Bills': ['Bills', 'Buffalo', 'Buffalo Bills', 'Buffalo. Bills', 'BUF'],
                'Broncos': ['Broncos', 'Denver', 'Denver Broncos', 'Denver. Broncos', 'DEN'],
                'Browns': ['Browns', 'Cleveland', 'Cleveland Browns', 'Cleveland. Browns', 'CLE'],
                'Buccaneers': ['Buccaneers', 'Tampa Bay', 'Tampa Bay Buccaneers', 'Tampa Bay. Buccaneers', 'TB'],
                'Cardinals': ['Cardinals', 'Arizona', 'Arizona Cardinals', 'Arizona. Cardinals', 'ARI'],
                'Chargers': ['Chargers', 'Los Angeles', 'Los Angeles Chargers', 'Los Angeles. Chargers', 'LAC'],
                'Chiefs': ['Chiefs', 'Kansas City', 'Kansas City Chiefs', 'Kansas City. Chiefs', 'KC'],
                'Colts': ['Colts', 'Indianapolis', 'Indianapolis Colts', 'Indianapolis. Colts', 'IND'],
                'Commanders': ['Commanders', 'Washington', 'Washington Commanders', 'Washington. Commanders', 'WAS'],
                'Cowboys': ['Cowboys', 'Dallas', 'Dallas Cowboys', 'Dallas. Cowboys', 'DAL'],
                'Dolphins': ['Dolphins', 'Miami', 'Miami Dolphins', 'Miami. Dolphins', 'MIA'],
                'Eagles': ['Eagles', 'Philadelphia', 'Philadelphia Eagles', 'Philadelphia. Eagles', 'PHI'],
                'Falcons': ['Falcons', 'Atlanta', 'Atlanta Falcons', 'Atlanta. Falcons', 'ATL'],
                'Giants': ['Giants', 'New York', 'New York Giants', 'New York. Giants', 'NYG'],
                'Jaguars': ['Jaguars', 'Jacksonville', 'Jacksonville Jaguars', 'Jacksonville. Jaguars', 'JAX'],
                'Jets': ['Jets', 'New York', 'New York Jets', 'New York. Jets', 'NYJ'],
                'Lions': ['Lions', 'Detroit', 'Detroit Lions', 'Detroit. Lions', 'DET'],
                'Packers': ['Packers', 'Green Bay', 'Green Bay Packers', 'Green Bay. Packers', 'GB'],
                'Panthers': ['Panthers', 'Carolina', 'Carolina Panthers', 'Carolina. Panthers', 'CAR'],
                'Patriots': ['Patriots', 'New England', 'New England Patriots', 'New England. Patriots', 'NE'],
                'Raiders': ['Raiders', 'Las Vegas', 'Las Vegas Raiders', 'Las Vegas. Raiders', 'LV'],
                'Rams': ['Rams', 'Los Angeles', 'Los Angeles Rams', 'Los Angeles. Rams', 'LA'],
                'Ravens': ['Ravens', 'Baltimore', 'Baltimore Ravens', 'Baltimore. Ravens', 'BAL'],
                'Saints': ['Saints', 'New Orleans', 'New Orleans Saints', 'New Orleans. Saints', 'NO'],
                'Seahawks': ['Seahawks', 'Seattle', 'Seattle Seahawks', 'Seattle. Seahawks', 'SEA'],
                'Steelers': ['Steelers', 'Pittsburgh', 'Pittsburgh Steelers', 'Pittsburgh. Steelers', 'PIT'],
                'Texans': ['Texans', 'Houston', 'Houston Texans', 'Houston. Texans', 'HOU'],
                'Titans': ['Titans', 'Tennessee', 'Tennessee Titans', 'Tennessee. Titans', 'TEN'],
                'Vikings': ['Vikings', 'Minnesota', 'Minnesota Vikings', 'Minnesota. Vikings', 'MIN']
            }

            let dynamicTeamNames = {};

            Object.values(teamNames).forEach(teamNamePermutations => {
                teamNamePermutations.forEach(teamName => {
                    dynamicTeamNames[teamName] = teamNamePermutations;
                })
            });

            return dynamicTeamNames;
        }
    }
    function makeSettingsModule() {
        const self = {
            editSettings,
            hideSettings,
            selectors: {
                panel: ui.makeSelector('fuseSettingsPanel'),
                tabs: ui.makeSelector('fuseSettingsPanel__tabs'),
            }
        }

        return self;

        function editSettings() {
            if (self.selectors.panel.get()) {
                hideSettings();

                return;
            }

            let settingsPanel = createMainSettingsPanel();
            const state = store.getState().data

            const borisChenTab = borisChen.settingsPanel.createTab(state.borisChen)

            // TODO move this inside the module definition...maybe
            const toggleBorisChenTab = dom.makeButton('BorisChen', () => {
                toggleTabs(borisChenTab.id)
            });

            const subvertADownTab = subvertADown.settingsPanel.createSubvertADownTab(state.subvertADown);
            const toggleSubvertADownTab = dom.makeButton('SubvertADown', () => {
                toggleTabs(subvertADownTab.id)
            });

            const customDataTab = customData.settingsPanel.createCustomDataTab(state.customData);
            const toggleCustomData = dom.makeButton('CustomData', () => {
                toggleTabs(customDataTab.id)
            });
            settingsPanel.appendChild(toggleBorisChenTab);
            settingsPanel.appendChild(toggleSubvertADownTab);
            settingsPanel.appendChild(toggleCustomData);
            settingsPanel.appendChild(borisChenTab);
            settingsPanel.appendChild(subvertADownTab);
            settingsPanel.appendChild(customDataTab);

            const saveBtn = dom.makeButton('Save', () => {
                // TODO refactor this such that modules register them self with this save handler, and implement the actual save logic internally.
                let state = store.getState();

                state.data.borisChen = { ...state.data.borisChen, ...borisChen.settingsPanel.getFormData() };
                state.data.borisChen.parsed = borisChen.parseBorischenRawData(state.data.borisChen.raw);

                state.data.subvertADown = { ...state.data.subvertADown, ...subvertADown.settingsPanel.getSubvertADownFormData() };
                state.data.subvertADown.parsed = subvertADown.settingsPanel.parseSubvertADownFormRawData(state.data.subvertADown.raw);

                state.data.customData = { ...state.data.customData, ...customData.settingsPanel.getCustomDataFormData() };
                state.data.customData.parsed = customData.settingsPanel.parseCustomDataFormData(state.data.customData.raw, state.data.customData);

                store.saveState(state);
                hideSettings();
                ui.injectFUSEInfoIntoFantasySite();
            });

            settingsPanel.appendChild(saveBtn);
            settingsPanel.appendChild(dom.makeButton('Hide', hideSettings));
            settingsPanel.appendChild(createVersionElement());

            document.body.insertBefore(settingsPanel, document.getElementById(showSettingsBtn.id).nextSibling);
            toggleTabs(borisChenTab.id);

            function createVersionElement() {
                const versionSpan = document.createElement('span');
                versionSpan.textContent = `v${version}`;
                versionSpan.style.position = 'absolute';
                versionSpan.style.bottom = '0';
                versionSpan.style.right = '0';;
                versionSpan.style.fontSize = 'smaller';

                return versionSpan;
            }
            function createMainSettingsPanel() {
                const settingsPanel = document.createElement('div');

                settingsPanel.setAttribute('id', self.selectors.panel.id);
                settingsPanel.style.position = 'fixed';
                settingsPanel.style.top = '125px';
                settingsPanel.style.right = '0';
                settingsPanel.style.backgroundColor = '#f9f9f9';
                settingsPanel.style.width = '410px';
                settingsPanel.style.padding = '10px';
                settingsPanel.style.zIndex = '9999999';
                settingsPanel.style.textAlign = 'left';

                settingsPanel.style.padding = '15px';
                settingsPanel.style.border = '1px solid #ccc';
                settingsPanel.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.1)';

                return settingsPanel
            }

            function hideAllTabs() {
                const tabs = document.querySelectorAll(`.${self.selectors.tabs.id}`);

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
            document.body.removeChild(self.selectors.panel.get());
        }
    }

    function makeBorisChenModule() {
        function borisChenSelector(id, attribute) {
            return ui.makeSelector(`${settings.selectors.tabs.id}__borisChen_${id}`, attribute);
        }

        const self = {
            runBorisChenAutoUpdate,
            parseBorischenRawData,
            settingsPanel: {
                createTab,
                getFormData,
                selectors: {
                    tab: borisChenSelector('tab'),
                    prefix: borisChenSelector('prefix'),
                    scoring: borisChenSelector('scoring'),
                    autoFetch: borisChenSelector('autoFetch'),
                    lastFetched: borisChenSelector('lastFetched', 'data-state'),
                    fetchDataBtn: borisChenSelector('fetchDataBtn'),
                    positions: {
                        id: (position) => `${settings.selectors.tabs.id}_borisChen_${position}`,
                        get: (position) => document.getElementById(`${settings.selectors.tabs.id}_borisChen_${position}`),
                        getValue: function (position) {
                            const el = this.get(position);
                            return el ? el.value : null;
                        },
                        setValue: function (position, value) {
                            return this.get(position).value = value;
                        }
                    }
                }
            }
        }

        return self;

        async function runBorisChenAutoUpdate() {
            let state = store.getState();
            const isDaily = state.data.borisChen.autoFetch === 'Daily';
            const hasBeenFetched = !!state.data.borisChen.lastFetched;
            const ranAsUserScript = !!window.GM?.info
            const eligibleForAutoUpdate = isDaily && hasBeenFetched && ranAsUserScript;

            if (!eligibleForAutoUpdate) {
                return Promise.resolve();
            }

            const lastFetched = parseInt(state.data.borisChen.lastFetched, 10);
            const currentTime = Date.now();
            const twentyFourHoursInMs = 24 * 60 * 60 * 100;

            const isBelow24HoursOld = (currentTime - lastFetched) < twentyFourHoursInMs;

            if (isBelow24HoursOld) {
                return Promise.resolve();
            }

            const rawData = await fetchDataFromBorisChenWebsite(state.data.borisChen.scoring);
            state.data.borisChen.raw = rawData;
            state.data.borisChen.parsed = parseBorischenRawData(rawData);
            state.data.borisChen.lastFetched = Date.now();

            store.saveState(state);

            return Promise.resolve();
        }

        function parseBorischenRawData(rawTierData) {
            const playerDictionary = {};

            parseTierInfo(rawTierData.QB, playerDictionary);
            parseTierInfo(rawTierData.RB, playerDictionary);
            parseTierInfo(rawTierData.WR, playerDictionary);
            parseTierInfo(rawTierData.TE, playerDictionary);
            parseTierInfo(rawTierData.FLEX, playerDictionary);
            parseTierInfo(splitUpDSTByPlatform(rawTierData.DST), playerDictionary);
            parseTierInfo(rawTierData.K, playerDictionary);

            return playerDictionary;

            function parseTierInfo(raw, playerDictionary) {
                if (!raw) {
                    return
                }

                const tiers = raw.split('\n');

                tiers.forEach(tierRow => {
                    const row = tierRow.split(': ');
                    const tier = row[0].replace('Tier ', '');
                    const playersInTier = row[1];

                    playersInTier?.split(', ').forEach((player, index) => {
                        players.addPlayerInfoToDictionary(player, `${tier}.${index + 1}`, playerDictionary);
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
                        // Team name is the last word
                        const teamName = team.split(' ').pop();

                        if (index !== 0) {
                            rowOutput += `, `;
                        }

                        rowOutput += `${teamName}`;
                    });

                    output.push(rowOutput);
                });

                return output.join('\n');
            }
        }

        async function fetchDataFromBorisChenWebsite(scoring) {
            const scoreSuffix = {
                "PPR": "-PPR",
                "0.5 PPR": "-HALF",
                "Standard": ""
            }

            const positionsToGet = [
                { key: 'QB', val: `QB` },
                { key: 'RB', val: `RB${scoreSuffix[scoring]}` },
                { key: 'WR', val: `WR${scoreSuffix[scoring]}` },
                { key: 'TE', val: `TE${scoreSuffix[scoring]}` },
                { key: 'FLEX', val: `FLX${scoreSuffix[scoring]}` },
                { key: 'K', val: `K` },
                { key: 'DST', val: `DST` },
            ]

            let rawTierData = {};

            const promises = positionsToGet.map(position => {
                return new Promise((resolve, reject) => {
                    GM.xmlHttpRequest({
                        method: "GET",
                        url: makeUrlString(position.val),
                        headers: {
                            "Accept": "text/plain"
                        },
                        onload: (response) => {
                            if (response.status >= 200 && response.status < 400) {
                                rawTierData[position.key] = response.responseText;
                                resolve();
                            } else {
                                reject(new Error('Request failed'));
                            }
                        },
                        onerror: () => {
                            reject(new Error('Network error'));
                        }
                    });
                });
            });
            await Promise.all(promises);

            return rawTierData;

            function makeUrlString(position) {
                return `https://s3-us-west-1.amazonaws.com/fftiers/out/text_${position}.txt`;
            }
        }

        function createTab(savedData) {
            const { selectors } = self.settingsPanel;
            const tab = dom.makeTabElement(
                selectors.tab.id,
                "To get the tier data from www.borisChen.co for your league's point values and paste the raw tier info into the below text areas."
            );

            const prefixField = dom.makeInputField(
                'Prefix (optional)',
                selectors.prefix.id,
                'Ex: BC',
                savedData.prefix,
            );

            tab.appendChild(prefixField);
            const positions = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST', 'K'];
            if (window.GM?.info) {
                const dataSettings = document.createElement('div');
                dataSettings.style.display = 'flex';
                dataSettings.style.justifyContent = 'space-between';
                dataSettings.style.marginBottom = '10px';

                const scoringField = dom.makeDropdownField(
                    'Scoring',
                    selectors.scoring.id,
                    ['Standard', '0.5 PPR', 'PPR'],
                    savedData.scoring
                );

                const autoFetchField = dom.makeDropdownField(
                    'AutoFetch',
                    selectors.autoFetch.id,
                    ['Never', 'Daily'],
                    savedData.autoFetch
                );

                autoFetchField.style.visibility = !!savedData.lastFetched ? 'visible' : 'hidden';

                const lastFetchedDateTime = utils.formatTimestamp(savedData.lastFetched)

                const lastFetchedField = dom.makeReadOnlyField(
                    'Last Fetched',
                    selectors.lastFetched.id,
                    lastFetchedDateTime,
                    savedData.lastFetched
                );
                lastFetchedField.style.visibility = !!savedData.lastFetched ? 'visible' : 'hidden';

                // TODO bits of this still are broken, auto fetch/last fetched not showing, last fetched value missing
                const fetchDataBtn = dom.makeButton('Fetch', async () => {
                    const btn = selectors.fetchDataBtn.get();
                    btn.disabled = true;
                    const scoring = selectors.scoring.getValue();
                    const rawData = await fetchDataFromBorisChenWebsite(scoring);
                    btn.disabled = false;
                    const lastFetchedTimestamp = Date.now()
                    selectors.lastFetched.setValue(lastFetchedTimestamp)
                    selectors.lastFetched.get().textContent = utils.formatTimestamp(lastFetchedTimestamp);

                    lastFetchedField.style.visibility = 'visible';
                    autoFetchField.style.visibility = 'visible';

                    for (const position of positions) {
                        selectors.positions.setValue(position, rawData[position]);
                    }
                });
                // TODO move this into the makeButton method
                fetchDataBtn.id = selectors.fetchDataBtn.id;

                dataSettings.appendChild(scoringField);
                dataSettings.appendChild(autoFetchField);
                dataSettings.appendChild(lastFetchedField);

                tab.appendChild(dataSettings);
                tab.appendChild(fetchDataBtn);
            }

            for (const position of positions) {
                const positionField = dom.makeTextAreaField(
                    position,
                    selectors.positions.id(position),
                    savedData.raw[position],
                );

                tab.appendChild(positionField);
            }

            return tab;
        }

        function getFormData() {
            const { selectors } = self.settingsPanel;
            const data = {
                raw: {},
                prefix: selectors.prefix.getValue(),
                scoring: selectors.scoring.getValue(),
                autoFetch: selectors.autoFetch.getValue(),
                lastFetched: selectors.lastFetched.getValue()
            };

            const positions = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST', 'K'];

            for (const position of positions) {
                data.raw[position] = selectors.positions.getValue(position);
            }

            return data;
        }
    }

    function makeSubvertADownModule() {
        function subvertADownSelector(id, attribute) {
            return ui.makeSelector(`${settings.selectors.tabs.id}__subvertADown_${id}`, attribute);
        }

        const self = {
            settingsPanel: {
                createSubvertADownTab,
                getSubvertADownFormData,
                parseSubvertADownFormRawData,
                selectors: {
                    tab: subvertADownSelector('tab'),
                    prefix: subvertADownSelector('prefix'),
                    raw: subvertADownSelector('raw'),
                    positions: {
                        id: (position) => `${settings.selectors.tabs.id}_subvertADown_${position}`,
                        get: (position) => document.getElementById(`${settings.selectors.tabs.id}_subvertADown_${position}`),
                        getValue: function (position) {
                            const el = this.get(position);
                            return el ? el.value : null;
                        }
                    }
                }
            }
        }

        return self;

        function createSubvertADownTab(savedData) {
            const tab = dom.makeTabElement(
                self.settingsPanel.selectors.tab.id,
                "Copy data from https://subvertadown.com and paste the raw tier info into the below text areas."
            );

            const prefixField = dom.makeInputField(
                'Prefix (optional)',
                self.settingsPanel.selectors.prefix.id,
                'Ex: SD',
                savedData.prefix,
            );

            tab.appendChild(prefixField);

            const positions = ['DST', 'QB', 'K'];

            for (const position of positions) {
                const positionField = dom.makeTextAreaField(
                    position,
                    self.settingsPanel.selectors.positions.id(position),
                    savedData.raw[position],
                );

                tab.appendChild(positionField);
            }

            return tab;
        }

        function getSubvertADownFormData() {
            const data = {
                raw: {},
                prefix: self.settingsPanel.selectors.prefix.getValue(),
            };

            const positions = ['QB', 'DST', 'K'];

            for (const position of positions) {
                data.raw[position] = self.settingsPanel.selectors.positions.getValue(position)
            }

            return data;
        }

        function parseSubvertADownFormRawData(rawData) {
            const playersDictionary = {};

            processData(rawData.DST, playersDictionary, true);
            processData(rawData.QB, playersDictionary);
            processData(rawData.K, playersDictionary);

            return playersDictionary;

            function processData(input, playersDictionary, isDST) {
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
                        players.addPlayerInfoToDictionary(player, line.trim(), playersDictionary);

                        // reset for next iteration
                        player = ''
                    }
                })

                return playersDictionary;
            }
        }
    }

    function makeCustomDataModule() {
        function customDataSelector(id, attribute) {
            return ui.makeSelector(`${settings.selectors.tabs.id}__customData_${id}`, attribute);
        }

        const self = {
            settingsPanel: {
                createCustomDataTab,
                getCustomDataFormData,
                parseCustomDataFormData,
                selectors: {
                    tab: customDataSelector('tab'),
                    prefix: customDataSelector('prefix'),
                    raw: customDataSelector('raw'),
                    delimiter: customDataSelector('delimiter'),
                    playerColumn: customDataSelector('playerColumn'),
                    displayColumn: customDataSelector('displayColumn'),
                    custom: customDataSelector('custom'),
                }
            }
        }

        return self;

        function createCustomDataTab(savedData) {
            const { selectors } = self.settingsPanel;
            const tab = dom.makeTabElement(
                selectors.tab.id,
                "Paste in your own data from a spreadsheet or another website."
            );

            const prefixField = dom.makeInputField(
                'Prefix (optional)',
                selectors.prefix.id,
                'Ex: C',
                savedData.prefix,
            );

            tab.appendChild(prefixField);
            const dataSettings = document.createElement('div');
            dataSettings.style.display = 'flex';
            dataSettings.style.justifyContent = 'space-between';
            dataSettings.style.marginBottom = '10px';

            const delimiterField = dom.makeDropdownField(
                'Delimiter',
                selectors.delimiter.id,
                ['Tab', 'Space', 'Comma'],
                savedData.delimiter
            );
            dataSettings.appendChild(delimiterField);

            const playerColumnField = dom.makeDropdownField(
                'Player Column',
                selectors.playerColumn.id,
                Array(20).fill().map((_, i) => i + 1),
                savedData.playerColumn
            );
            dataSettings.appendChild(playerColumnField);

            const displayColumnField = dom.makeDropdownField(
                'Display Columns',
                selectors.displayColumn.id,
                ['All', ...Array(20).fill().map((_, i) => i + 1)],
                savedData.displayColumn
            );
            dataSettings.appendChild(displayColumnField);

            tab.appendChild(dataSettings);

            const positionField = dom.makeTextAreaField(
                'Custom',
                selectors.custom.id,
                savedData.raw['custom'],
                { height: '200px', placeholder: 'Patrick Mahomes, Regress to mean' }
            );

            tab.appendChild(positionField);

            return tab;
        }

        function getCustomDataFormData() {
            const { selectors } = self.settingsPanel;
            const data = {
                raw: {},
                prefix: selectors.prefix.getValue(),
                delimiter: selectors.delimiter.getValue(),
                playerColumn: selectors.playerColumn.getValue(),
                displayColumn: selectors.displayColumn.getValue()
            };

            data.raw['custom'] = selectors.custom.getValue();

            return data;
        }

        function parseCustomDataFormData(rawData, savedData) {
            const playersDictionary = {};
            const lines = rawData.custom.split('\n');

            const delimiters = {
                'Tab': '\t',
                'Space': ' ',
                'Comma': ','
            }

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length === 0) continue;

                const columns = line.split(delimiters[savedData.delimiter]);
                const playerName = columns[savedData.playerColumn - 1];
                if (!playerName) continue;

                let restOfData = [];

                if (savedData.displayColumn === 'All') {
                    restOfData = [...columns.slice(0, savedData.playerColumn - 1), ...columns.slice(savedData.playerColumn)];
                } else {
                    restOfData.push(columns[savedData.displayColumn - 1]);
                }

                players.addPlayerInfoToDictionary(playerName, restOfData.join(',').trim(), playersDictionary);
            }

            return playersDictionary;
        }
    }

    function makeUtilsModule() {
        return {
            isObject,
            mergeDeep,
            formatTimestamp
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

        function formatTimestamp(timestamp) {
            const date = new Date(parseInt(timestamp, 10));

            if (isNaN(date.getTime())) {
                return '';
            }

            // Extracting the date in YYYY/MM/DD format
            const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
            const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);

            // Extracting the time in 12-hour format with AM/PM
            const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
            const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(date).toLowerCase();  // Convert to lowercase to get "am/pm"

            return `${formattedDate} @ ${formattedTime}`;
        }
    }

    function makeDOMModule() {

        return {
            makePageButton,
            makeButton,
            makeTabElement,
            makeLabelElement,
            makeReadOnlyField,
            makeInputField,
            makeTextAreaField,
            makeDropdownField
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
            button.style.zIndex = '9999999';
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
            tab.className = settings.selectors.tabs.id;
            tab.style.padding = '10px';
            tab.style.maxHeight = '70vh';
            tab.style.overflowY = 'auto';

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

        function makeReadOnlyField(labelText, id, value, state) {
            const field = document.createElement('div');
            const label = makeLabelElement(labelText);
            const displayValue = document.createElement('span');
            displayValue.id = id;
            displayValue.setAttribute('data-state', state);
            displayValue.style.marginBottom = '10px';
            displayValue.textContent = value;

            field.appendChild(label);
            field.appendChild(displayValue);

            return field;
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

        function makeDropdownField(labelText, id, options, selectedValue) {
            const field = document.createElement('div');
            const label = makeLabelElement(labelText);
            field.appendChild(label);

            const selectElement = document.createElement('select');
            selectElement.id = id;

            options.forEach((option) => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;

                if (option.toString() === selectedValue.toString()) {
                    optionElement.selected = true;
                }

                selectElement.appendChild(optionElement);
            });

            field.appendChild(selectElement);

            return field;
        }
    }

}
)();