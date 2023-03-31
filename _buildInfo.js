const packageJSON = require("./package.json");
// const srcVersion = require("./src/buildConfig.json");
const fs = require("fs")

const isSnapshot = packageJSON.version.indexOf("snapshot") !== -1
const srcVersion = {
    version: packageJSON.version,
    date: new Date().toLocaleDateString("fa-IR"),
    VersionInfo: `Release: ${!isSnapshot}, Snapshot: ${isSnapshot}, Is For Test: ${isSnapshot}`
};

fs.writeFile("./src/buildConfig.json", JSON.stringify(srcVersion), 'utf8', (err)=>{
    if (err) {
        console.error("[Builder] Build info failed.")
        return console.error(err);
    }

    console.log("[Builder] Build info done.")
});

