const googleTTS = require("google-tts-api");
const fs = require("fs");
const https = require("https");
const path = require("path");


async function createVoice(text) {


    const filePath = path.join(__dirname, "voice.mp3");


    const urls = googleTTS.getAllAudioUrls(text, {
        lang: "vi",
        slow: false
    });



    const file = fs.createWriteStream(filePath);



    for (const item of urls) {

        await new Promise((resolve, reject) => {


            https.get(item.url, res => {

                res.pipe(file, {
                    end:false
                });


                res.on("end", resolve);

            }).on("error", reject);


        });

    }


    return new Promise(resolve => {

        file.end(() => {

            resolve(filePath);

        });

    });


}


module.exports = {
    createVoice
};