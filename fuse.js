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

    const runUpdateBtn = makeButton(selectors.runUpdateBtn, 'Update', 150);

    runUpdateBtn.addEventListener('click', updatePlayerInfo);

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

    const configure = makeButton(selectors.showSettingsBtn, '⚙', 175);

    configure.addEventListener('click', editSettings);

    function editSettings() {
        if (document.getElementById(selectors.settingPanel.name)) {
            hideSettings();

            return;
        }

        const section = document.createElement('div');

        section.setAttribute('id', selectors.settingPanel.name);
        section.style.position = 'absolute';
        section.style.top = '200px';
        section.style.right = '0';
        section.style.backgroundColor = '#f9f9f9';
        section.style.width = '200px';

        section.style.padding = '15px';
        section.style.border = '1px solid #ccc';
        section.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.1)';


        const helpText = document.createElement('p');

        helpText.textContent = 'To get the tier data from www.borischen.co for your league\'s point values and paste the raw tier info into the below text areas.';
        section.appendChild(helpText);

        const positions = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];
        const savedData = getStoredData().data.borischen.raw;

        for (const position of positions) {
            const label = document.createElement('label');

            label.textContent = position;

            const textarea = document.createElement('textarea');

            textarea.setAttribute('id', `${selectors.settingPanel.borischen}_${position}`);
            if (savedData[position]) {
                textarea.value = savedData[position];
            }

            section.appendChild(label);
            section.appendChild(document.createElement('br'));

            section.appendChild(textarea);
            section.appendChild(document.createElement('br'));

        }

        const saveBtn = document.createElement('button');

        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
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
        section.appendChild(saveBtn);

        const hideBtn = document.createElement('button');

        hideBtn.textContent = 'Hide';
        hideBtn.addEventListener('click', hideSettings);
        section.appendChild(hideBtn);

        document.body.insertBefore(section, document.getElementById(selectors.showSettingsBtn).nextSibling);
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

    function makeButton(id, text, offset) {
        const existingBtn = document.getElementById(id);

        if (document.contains(existingBtn)) {
            existingBtn.remove();
        }

        const button = document.createElement('button');

        button.id = id;
        button.innerHTML = text;
        button.style.position = 'absolute';
        button.style.top = `${offset}px`;
        button.style.right = 0;
        button.style.color = 'green';
        button.style['z-index'] = '10000';

        const body = document.getElementsByTagName('body')[0];

        body.appendChild(button);

        return button;
    }
}
)();