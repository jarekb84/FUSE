# FUSE: Fantasy User Stat Enhancer

FUSE lets you enhance player stats in your fantasy football app by layering in your own custom data to simplify roster selection, free agent scouting, and trade evaluations. [Install instructions below ](#install-instructions)

| ESPN             | Yahoo             | NFL.com           |
|------------------|------------------ |------------------ |
| ![ESPN Team Overview](/dist/assets/espn_team_overview.png) | ![Yahoo Roster Overview](/dist/assets/yahoo_roster_overview.png) | ![NFL.com My Team Overview](/dist/assets/nfl_my_team_overview.png) |


https://github.com/jarekb84/FUSE/assets/667983/766e9f9a-fc4a-4e20-9eda-1192c00729e4


## Features
Currently FUSE has the following capabilities

- Borischen tiers
- SubvertADown streaming values
  - DST not supported on Yahoo since it uses city name
- Custom CSV data

FUSE should work on most pages where a player name is shown
| ESPN             | Yahoo            | Yahoo             |
|------------------|------------------|------------------ |
| My Team          | Roster           | My Team           |
| Opposing Teams   | Player Updates   | Players Add       |
| Free Agents      | Watch List       | Other Teams       |
| Scoring Leaders  | Player List      | Trade Players     |
| FantasyCast      | Matchups         | Game Center       |
| Box Scores       | Research Overview|                   |
|                  | Injury Reports   |                   |
|                  | Propose Trade    |                   |

## Importing Data
Data is imported manually by copying and pasting the content from a given site. FUSE includes some logic to transform the pasted text into something which can be used to extend player info.

### Borischen
Go to the position page in [borischen.co](http://www.borischen.co/) that's relevant for your league's scoring rules and copy the data over to FUSE.

You may need to tweak some player names if they differ from what's shown in your fantasy platform, otherwise FUSE info won't be added. For example Borischen shows `Patrick Mahomes II` while ESPN omits the `II`.

![Borischen copying data example](/dist/assets/borischen_copying.png)

### SubvertADown
Go to [subvertadown.com](https://subvertadown.com/) and copy the position stats on the home page over to FUSE. The full projection page tables are not supported.

![SubvertADown copying data example](/dist/assets/subvertadown_copying.png)

## Install instructions 

At this time, this is just a bit of javascript, so you can either copy the fuse.js code and it into chrome dev tools or us the JS bookmarklet example below.

### Bookmarklet
This is a bookmark where instead of a URL, it runs a bit of javascript to fetch the FUSE.js file and execute it.

1. Go to https://jarekb84.github.io/FUSE
2. Drag the FUSE link to your bookmarks bar
3. Click the bookmarklet to run FUSE on a page

![FUSE Install](/dist/assets/FUSE_install.gif)