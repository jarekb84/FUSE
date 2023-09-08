(function () {
    const selectors = {
        runUpdateBtn: 'fuseRunUpdate',
        playerInfo: 'fusePlayerInfo',
        showSettingsBtn: 'fuseShowSettings',
        settingPanel: {
            name: 'fuseSettingsPanel',
            borischen: 'fuseSettingsPanel_borischen'
        },
        localStorage: 'fuseStorage'
    }

    makePageButton(selectors.runUpdateBtn, 'Update', 150, updatePlayerInfo);

    function updatePlayerInfo() {
        const spans = document.querySelectorAll(`.${selectors.playerInfo}`);

        spans.forEach(span => {
            span.remove();
        });

        const players = getStoredData().data.borischen.parsed;

        document.querySelectorAll('.player-column__bio .AnchorLink.link').forEach(playerNameEl => {
            const name = playerNameEl.innerText;
            const playerTier = players[name];

            if (!playerTier || !name) {
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
                    span.textContent = playerTier;

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

        const borisChenTab = createBorisChenTab(savedData.borischen)
        settingsPanel.appendChild(borisChenTab);

        const saveBtn = makeButton('Save', () => {
            let state = {
                data: {
                    borischen: {
                        raw: getBorischenFormData(),
                        parsed: {}
                    }
                }
            }

            state.data.borischen.parsed = parseBorischenRawData(state.data.borischen.raw);
            saveToLocalStorage(state);
            hideSettings();
            updatePlayerInfo();
        });
        
        settingsPanel.appendChild(saveBtn);
        settingsPanel.appendChild(makeButton('Hide', hideSettings));

        document.body.insertBefore(settingsPanel, document.getElementById(selectors.showSettingsBtn).nextSibling);

        function createMainSettingsPanel() {
            const settingsPanel = document.createElement('div');

            settingsPanel.setAttribute('id', selectors.settingPanel.name);
            settingsPanel.style.position = 'absolute';
            settingsPanel.style.top = '200px';
            settingsPanel.style.right = '0';
            settingsPanel.style.backgroundColor = '#f9f9f9';
            settingsPanel.style.width = '400px';

            settingsPanel.style.padding = '15px';
            settingsPanel.style.border = '1px solid #ccc';
            settingsPanel.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.1)';

            return settingsPanel
        }

        function createBorisChenTab(savedData){
            const tab = document.createElement('div');
            tab.id = selectors.settingPanel.borischen;
            const helpText = document.createElement('p');

            helpText.textContent = 'To get the tier data from www.borischen.co for your league\'s point values and paste the raw tier info into the below text areas.';
            tab.appendChild(helpText);
    
            const positions = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];            
    
            for (const position of positions) {
                const label = document.createElement('label');
    
                label.textContent = position;
    
                const textarea = document.createElement('textarea');
    
                textarea.setAttribute('id', `${selectors.settingPanel.borischen}_${position}`);
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
    }

    function hideSettings() {
        document.body.removeChild(document.getElementById(selectors.settingPanel.name));
    }

    function getStoredData() {
        const storedData = localStorage.getItem(selectors.localStorage);
        const parsedData = JSON.parse(storedData) || {
            data: {
                borischen: {
                    raw: {},
                    parsed: {}
                }
            }
        };

        console.log(parsedData)

        return parsedData;
    }

    function saveToLocalStorage(data) {
        localStorage.setItem(selectors.localStorage, JSON.stringify(data));
        console.log(data)
    }

    function getBorischenFormData() {
        const data = {};

        const positions = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];

        for (const position of positions) {
            data[position] = document.getElementById(`${selectors.settingPanel.borischen}_${position}`).value;
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