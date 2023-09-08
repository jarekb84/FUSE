(function () {
    const selectors = {
        runUpdateBtn: 'fuseRunUpdate',
        playerInfo: 'fusePlayerInfo',
        showSettingsBtn: 'fuseShowSettings',
        settingPanel: {
            name: 'fuseSettingsPanel',
            tabs: 'fuseSettingsPanel__tabs',
            borisChen: 'fuseSettingsPanel__tabs__borisChen',
            subvertADown: 'fuseSettingsPanel__tabs__subvertADown'
        },
        localStorage: 'fuseStorage'
    }

    makePageButton(selectors.runUpdateBtn, 'Update', 150, updatePlayerInfo);

    function updatePlayerInfo() {
        const spans = document.querySelectorAll(`.${selectors.playerInfo}`);

        spans.forEach(span => {
            span.remove();
        });

        const data = getStoredData().data;
        const borisChen = data.borisChen.parsed
        const subvertADown = data.subvertADown.parsed

        document.querySelectorAll('.player-column__bio .AnchorLink.link').forEach(playerNameEl => {
            const name = playerNameEl.innerText;
            const borisChenTier = borisChen[name];
            const subvertADownValue = subvertADown[name];
            const info = [borisChenTier, subvertADownValue].filter(val => val);

            if (!info.length || !name) {
                return
            }

            const playerBioElem = playerNameEl.closest('.player-column__bio');

            if (playerBioElem) {
                const playerPositionElem = playerBioElem.querySelector('.player-column__position');

                if (playerPositionElem) {
                    const span = document.createElement('span');

                    span.className = selectors.playerInfo;
                    span.style.marginRight = '2px';
                    span.style.fontWeight = '900';
                    span.textContent = `${info.join('/')}`;

                    playerPositionElem.insertBefore(span, playerPositionElem.firstChild);
                }
            }
        });
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
        settingsPanel.appendChild(toggleBorisChenTab);
        settingsPanel.appendChild(toggleSubvertADownTab);
        settingsPanel.appendChild(borisChenTab);
        settingsPanel.appendChild(subvertADownTab);

        settingsPanel.appendChild(document.createElement('br'));

        const saveBtn = makeButton('Save', () => {
            let state = getStoredData();

            state.data.borisChen.raw = getBorischenFormData();
            state.data.borisChen.parsed = parseBorischenRawData(state.data.borisChen.raw);
            state.data.subvertADown.raw = getSubvertADownFormData();
            state.data.subvertADown.parsed = parseSubvertADownFormRawData(state.data.subvertADown.raw);
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
            settingsPanel.style.position = 'absolute';
            settingsPanel.style.top = '200px';
            settingsPanel.style.right = '0';
            settingsPanel.style.backgroundColor = '#f9f9f9';
            settingsPanel.style.width = '400px';
            settingsPanel.style.padding = '10px';

            settingsPanel.style.padding = '15px';
            settingsPanel.style.border = '1px solid #ccc';
            settingsPanel.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.1)';

            return settingsPanel
        }

        function createBorisChenTab(savedData) {
            const tab = document.createElement('div');
            tab.id = selectors.settingPanel.borisChen;
            tab.className = selectors.settingPanel.tabs;
            tab.appendChild(document.createElement('br'));
            const helpText = document.createElement('p');

            helpText.textContent = 'To get the tier data from www.borisChen.co for your league\'s point values and paste the raw tier info into the below text areas.';
            tab.appendChild(helpText);
            tab.appendChild(document.createElement('br'));

            const positions = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];

            for (const position of positions) {
                const label = document.createElement('label');

                label.textContent = position;

                const textarea = document.createElement('textarea');
                textarea.style.width = '350px';

                textarea.setAttribute('id', `${selectors.settingPanel.borisChen}_${position}`);
                if (savedData.raw[position]) {
                    textarea.value = savedData.raw[position];
                }

                tab.appendChild(label);
                tab.appendChild(document.createElement('br'));

                tab.appendChild(textarea);
                tab.appendChild(document.createElement('br'));
            }

            return tab;
        }

        function getBorischenFormData() {
            const data = {};

            const positions = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];

            for (const position of positions) {
                data[position] = document.getElementById(`${selectors.settingPanel.borisChen}_${position}`).value;
            }

            return data;
        }

        function parseBorischenRawData(rawTierData) {
            const players = {};

            parseTierInfo(rawTierData.QB, players);
            parseTierInfo(rawTierData.RB, players);
            parseTierInfo(rawTierData.WR, players);
            parseTierInfo(rawTierData.TE, players);
            parseTierInfo(removeCityFromDST(rawTierData.DST), players);
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
                        playerDictionary[player] = `${tier}.${index + 1}`;
                    });
                });


                return playerDictionary;
            }

            function removeCityFromDST(raw) {
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
                    let isFirst = true;

                    teams?.split(', ').forEach(team => {
                        const name = team.split(' ').pop();

                        if (isFirst) {
                            rowOutput += `${name} D/ST`;
                            isFirst = false;
                        } else {
                            rowOutput += `, ${name} D/ST`;
                        }
                    });

                    output.push(rowOutput);
                });

                return output.join('\n');
            }
        }

        function createSubvertADownTab(savedData) {
            const tab = document.createElement('div');
            tab.id = selectors.settingPanel.subvertADown;
            tab.className = selectors.settingPanel.tabs;
            tab.appendChild(document.createElement('br'));
            const helpText = document.createElement('p');

            helpText.textContent = 'Copy data from https://subvertadown.com and paste the raw tier info into the below text areas.';
            tab.appendChild(helpText);
            tab.appendChild(document.createElement('br'));

            const positions = ['DST', 'QB', 'K'];

            for (const position of positions) {
                const label = document.createElement('label');

                label.textContent = position;

                const textarea = document.createElement('textarea');
                textarea.style.width = '350px';

                textarea.setAttribute('id', `${selectors.settingPanel.subvertADown}_${position}`);
                if (savedData?.raw[position]) {
                    textarea.value = savedData.raw[position];
                }

                tab.appendChild(label);
                tab.appendChild(document.createElement('br'));

                tab.appendChild(textarea);
                tab.appendChild(document.createElement('br'));
            }

            return tab;
        }

        function getSubvertADownFormData() {
            const data = {};

            const positions = ['QB', 'DST', 'K'];

            for (const position of positions) {
                data[position] = document.getElementById(`${selectors.settingPanel.subvertADown}_${position}`).value;
            }

            return data;
        }

        function parseSubvertADownFormRawData(rawData) {
            const players = {};

            processData(rawData.DST, players);
            processData(rawData.QB, players);
            processData(rawData.K, players);

            return players;

            function processData(input, players) {
                const lines = input.trim().split('\n');

                let player = '';
                lines.forEach(line => {
                    // skip blank lines
                    if (!line.trim()) {
                        return;
                    }

                    if (!player) {
                        player = line.split('|')[0].trim();
                    } else {
                        value = line.trim();
                        players[player] = value;

                        // reset for next iteration
                        player = ''
                    }
                })


                return players;
            }
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
                }
            }
        };

        const result = mergeDeep(defaults, parsedData)

        console.log(result)

        return result;
    }

    function saveToLocalStorage(data) {
        localStorage.setItem(selectors.localStorage, JSON.stringify(data));
        console.log(data)
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

        button.style.position = 'absolute';
        button.style.top = `${offset}px`;
        button.style.right = 0;
        button.style.color = 'green';
        button.style['z-index'] = '10000';

        const body = document.getElementsByTagName('body')[0];

        body.appendChild(button);

        return button;
    }

    function makeButton(text, onClick) {
        const button = document.createElement('button');

        button.innerHTML = text;
        button.addEventListener('click', onClick);

        return button;
    }
}
)();