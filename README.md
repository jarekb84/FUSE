# FUSE
FUSE (Fantasy User Stat Enhancer)

FUSE lets you enhance player stats in your fantasy football app by layering in your own custom data. Currently, extending ESPN player names is supported with the following capabilities

- Borischen tiers
- SubvertADown streaming values

Check out the example below

![ESPN Team Overview](/dist/assets/espn_team_overview.png)

<video width="600" controls>
    <source src="https://github.com/jarekb84/FUSE/tree/main/dist/assets/Fuse_Demo.mp4" type="video/mp4">
</video>

## Copying data
Copying data is done manually by copying and pasting the data from a given site. FUSE includes some logic to transform the pasted text into something which can be used to extend ESPN player info.

### Borischen
Go to the position page in [borischen.co](http://www.borischen.co/) that's relevant for your league's scoring rules and copy the data over to FUSE.

You may need to tweak some player names if they differ from what's shown in ESPN, otherwise FUSE info won't be added. For example Borischen shows `Patrick Mahomes II` while ESPN omits the `II`.

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
