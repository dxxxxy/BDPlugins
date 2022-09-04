/**
 * @name hash
 * @author dxxxxy
 * @description hash.dreamys.studio but for BetterDiscord. https://dsc.gg/dxxxxy
 * @version 0.1.1
 * @changes Changes:
 * \n+ added update checker
 * \n+ removed context menu on click
 * \n+ deleted downloaded files
 */

module.exports = hash => ({
    start() {
        //really simple update checker
        request.get("https://raw.githubusercontent.com/DxxxxY/BDPlugins/master/hash.plugin.js", (err, res, body) => {
            if (err) return BdApi.alert("hash", `Error checking for updates: ${err}`)
            const script = fs.readFileSync(`${__dirname}/hash.plugin.js`, "UTF-8")
            if (body == script) return
            download("https://raw.githubusercontent.com/DxxxxY/BDPlugins/master/hash.plugin.js", `${__dirname}/hash.plugin.js`, (err) => {
                if (err) return BdApi.alert("hash", `Failed to update: ${err}`)
                console.log("[hash] Updated!")
                BdApi.alert("hash", `Updated to ${hash.version}`)
            })
        })
        console.log("[hash] Started!")
    },
    stop() {
        console.log("[hash] Stopped!")
    },
    observer() {
        const menu = document.querySelector("#message > div > div:nth-child(2)")

        //get selected message > get accessories > get attachments > get file attachment > get anchor
        const fileAnchor = document.querySelector(".selected-2LX7Jy > .container-2sjPya > .messageAttachment-CZp8Iv > .attachment-1PZZB2 > a")
        if (menu && !document.querySelector("#message-hash") && fileAnchor) { //add only once
            const url = fileAnchor.href //get file download link

            //replicate discord menu context button
            const button = document.createElement("div")
            button.className = "item-1OdjEX labelContainer-2vJzYL colorDefault-CDqZdO"
            button.id = "message-hash"
            button.setAttribute("role", "menuitem")
            button.setAttribute("tabindex", "-1")
            button.setAttribute("data-menu-item", "true")

            //replicate discord menu context button text
            const label = document.createElement("div")
            label.className = "label-2gNW3x"
            label.innerText = "Check Hash"

            button.onmouseover = () => {
                //replicate discord menu context button hover
                menu.parentNode.setAttribute("aria-activedescendant", "message-hash")
                button.className += " focused-3qFvc8"

                //add reaction staying lit fix
                document.querySelector("#message-add-reaction").className = document.querySelector("#message-add-reaction").className.replace(" focused-3qFvc8", "")
            }

            button.onmouseout = () => {
                //replicate discord menu context button escape
                menu.parentNode.removeAttribute("aria-activedescendant")
                button.className = button.className.replace(" focused-3qFvc8", "")
            }

            button.onclick = () => {
                menu.parentNode.parentNode.remove() //remove menu

                const dir = `${__dirname}/hash`
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }

                //download jar
                download(url, `${dir}/${url.substring(url.lastIndexOf("/") + 1)}`, (err) => {
                    if (err) BdApi.alert("hash", `Failed to download file: ${err}`)

                    //then download hashes
                    request.get("https://hash.dreamys.studio/script.js", (err, res, body) => {
                        if (err) BdApi.alert("hash", `Failed to download hashes: ${err}`)

                        //get hashes array from script.js
                        body = body.substring(body.indexOf("[{"), body.indexOf("}]") + 1).substring(1).replaceAll("\"", "\\\"")
                        body = body.replaceAll("name:", "\\\"name\\\":").replaceAll("hash:", "\\\"hash\\\":")
                        const collection = JSON.parse(JSON.parse(`\"[${body}]\"`))

                        //get and hash file
                        const fileReader = new FileReader()
                        const data = fs.readFileSync(`${dir}/${url.substring(url.lastIndexOf("/") + 1)}`)
                        const file = new File([data], url.substring(url.lastIndexOf("/") + 1))
                        fileReader.readAsBinaryString(file)
                        fileReader.onload = () => {
                            const hash = CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(fileReader.result)).toString()
                            let entry
                            const results = document.createElement("div")
                            collection.forEach(c => {
                                if (c.hash == hash) {
                                    entry = c.name
                                    results.innerHTML = `${file.name} matches SHA256 hash of <b style="color: lime;">${entry}</b>`
                                }
                            })
                            if (!entry) {
                                results.innerHTML = `${file.name} <b style="color: red;">doesn't match</b> any known SHA256 hashes.`
                                if (/session|login|token/.test(file.name.toLowerCase())) results.innerHTML += "<br>Most distributed session login mods are <b style=\"color: red;\">RATS</b>. You can check out <a href=\"https://github.com/DxxxxY/TokenAuth\">TokenAuth</a> for an opensource one."
                                if (/dupe|kmod|dmod/.test(file.name.toLowerCase())) results.innerHTML += "<br>Dupe mods <b style=\"color: red;\">aren't  public</b>. It is most likely a <b style=\"color: red;\">RAT</b>."
                            }

                            results.innerHTML += `<br><i>\n${hash}</i>`

                            //show popup
                            BdApi.showConfirmationModal("Hash Check", BdApi.React.createElement("div", {
                                class: "defaultColor-24IHKz",
                                dangerouslySetInnerHTML: { __html: results.innerHTML }
                            }), {
                                confirmText: "Okay",
                                cancelText: "Copy Result",
                                onCancel: () => clipboard.writeText(results.innerText)
                            })

                            //remove file at the end
                            fs.unlinkSync(`${dir}/${url.substring(url.lastIndexOf("/") + 1)}`)
                        }
                    })
                })
            }

            //append label and insert as first in menu
            button.appendChild(label)
            menu.insertBefore(button, menu.childNodes[0])
        }
    }
})

//imports
const fs = require("fs")
const request = require("request")
const { clipboard } = require("electron")

//cool way of loading scripts
request.get("https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/rollups/sha256.js", (err, res, body) => {
    if (err) BdApi.alert("hash", `Failed to download crypto-js: ${err}`)
    const script = document.createElement("script")
    script.innerHTML = body
    document.body.appendChild(script)
})

//basic file download
const download = (url, dest, cb) => {
    const file = fs.createWriteStream(dest)
    const sendReq = request.get(url)
    sendReq.on("response", (response) => {
        if (response.statusCode !== 200) return cb("Response status was " + response.statusCode)
        sendReq.pipe(file)
    })
    file.on("finish", () => file.close(cb))
    sendReq.on("error", (err) => {
        fs.unlink(dest, () => cb(err.message))
    })
    file.on("error", (err) => {
        fs.unlink(dest, () => cb(err.message))
    })
}