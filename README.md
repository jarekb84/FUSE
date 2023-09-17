# FUSE: Fantasy User Stat Enhancer

FUSE lets you enhance player stats in your fantasy football app by layering in your own custom data to simplify roster selection, free agent scouting, and trade evaluations. [Install instructions below ](#install-instructions)

| ESPN             | Yahoo             | NFL.com           | Sleeper           | CBS               |
|------------------|------------------ |------------------ |------------------ |------------------ |
| ![ESPN Team Overview](/dist/assets/espn_team_overview.png) | ![Yahoo Roster Overview](/dist/assets/yahoo_roster_overview.png) | ![NFL.com My Team Overview](/dist/assets/nfl_my_team_overview.png) | ![Sleeper Team Overview](/dist/assets/sleeper_team_overview.png) | ![CBS Team Overview](/dist/assets/cbs_team_overview.png) |


https://github.com/jarekb84/FUSE/assets/667983/766e9f9a-fc4a-4e20-9eda-1192c00729e4


## Features
Currently FUSE has the following capabilities

- Borischen tiers
  - Automatic and manual importing supported
  - Primary position and FLEX tiers separated by `|`
- SubvertADown streaming values
- Custom Data from any website or spreadsheet

FUSE should work on most pages where a player name is shown
| ESPN             | Yahoo            | NFL.com           | Sleeper           | CBS               |
|------------------|------------------|------------------ |------------------ |------------------ |
| My Team          | Roster           | My Team           | Matchup           | My Team           |
| Opposing Teams   | Player Updates   | Players Add       | Team              | Roster Grid       |
| Free Agents      | Watch List       | Other Teams       | Players           | Scout Team        |
| Scoring Leaders  | Player List      | Trade Players     | Trend             | Trades            |
| FantasyCast      | Matchups         | Game Center       | Scores            | Other Teams       |
| Box Scores       | Research Overview|                   |                   | Players           |
|                  | Injury Reports   |                   |                   | Gametracker       |
|                  | Propose Trade    |                   |                   | Scoring Preview   |

## Importing Data
Data is imported manually by copying and pasting the content from a given site. FUSE includes some logic to transform the pasted text into something which can be used to extend player info.

### Borischen
Go to the position page in [borischen.co](http://www.borischen.co/) that's relevant for your league's scoring rules and copy the data over to FUSE.

![Borischen copying data example](/dist/assets/borischen_copying.png)

### SubvertADown
Go to [subvertadown.com](https://subvertadown.com/) and copy the position stats on the home page over to FUSE. The full projection page tables are not supported.

![SubvertADown copying data example](/dist/assets/subvertadown_copying.png)

### Custom Data
Select which column has the player name and which columns to display. Works with tabular data from spreadsheets or websites.

![Custom Data copying data example](/dist/assets/custom_data_copying.png)


## How to Install and Use FUSE

FUSE can be set up in two main ways. Depending on your preference, and the features you need, you can choose the best method for you:

### 1. User Script Manager (Recommended)

> Only this version supports `Automatic BorisChen tier importing`

User scripts are little pieces of code that tweak how specific websites behave. To use FUSE this way:

1. **Get a User Script Manager**: This tool lets you manage and run user scripts.
   - FireFox: Download [Greasemonkey](https://www.greasespot.net/)
   - Chrome/Edge/Firefox: [TamperMonkey](http://tampermonkey.net) or [ViolentMonkey](https://violentmonkey.github.io/get-it)
   - For Safari: [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887)(free) or [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089) (paid)

2. **Download FUSE Script**:
   - Visit either [FUSE on GreasyFork](https://greasyfork.org/en/scripts/475542-fuse) or [FUSE on OpenUserJS](https://openuserjs.org/scripts/Dison/FUSE).
   - The script manager you chose in step 1 will guide you on installing FUSE.

3. **Refresh Your Browser**: After installation, refresh any web pages you have open to see FUSE in action.

4. **Stay Updated**: Inside your script manager's settings, enable the option to automatically check for FUSE updates.

### 2. Bookmarklet

> **Note**: This version does **not** support the "Automatic BorisChen importing" feature. Its main benefit is that you don't need to install any browser extensions.

Think of the bookmarklet as a special bookmark. Instead of taking you to a website, it runs FUSE for you.

1. Head over to [https://jarekb84.github.io/FUSE](https://jarekb84.github.io/FUSE).
2. Drag the **FUSE** link to your bookmarks bar.
3. When you want to run FUSE, simply click the bookmark you added.

For a visual step-by-step, refer below:  
![FUSE Install](/dist/assets/FUSE_install.gif)