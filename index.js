const spotify = require("spotify-url-info");
const { spawn } = require("child_process");
const SpotifyWebApi = require("spotify-web-api-node");


const spotifyApi = new SpotifyWebApi({
    clientId: "eb72bd8b184d4114a94f6fbb8a93bde5",
    clientSecret: "19ab837e9e4145c1b006c889336db993"
});


async function spotifyLogin() {

    try {

        const data = await spotifyApi.clientCredentialsGrant();

        spotifyApi.setAccessToken(
            data.body.access_token
        );

        console.log("✅ Spotify đã đăng nhập");

    } catch(err) {

        console.log("❌ Spotify login lỗi:", err);

    }

}


spotifyLogin();

let musicQueue = [];
let isPlaying = false;
let lastMessage = null;

const { 
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const play = require("play-dl");

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    StreamType
} = require("@discordjs/voice");

const ffmpegPath = require("ffmpeg-static");
const { createVoice } = require("./tts");

const prefix = "!";

process.env.FFMPEG_PATH = ffmpegPath;
process.env.PATH += ";" + require("path").dirname(ffmpegPath);


const client = new Client({

    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]

});

play.setToken({
    spotify: {
        client_id: "eb72bd8b184d4114a94f6fbb8a93bde5",
        client_secret: "19ab837e9e4145c1b006c889336db993"
    }
});


const player = createAudioPlayer();

let connection = null;
let pingLoop = null;

const deletedMessages = new Map();



player.on(AudioPlayerStatus.Playing, () => {
    console.log("🔊 Đang phát âm thanh");
});


player.on(AudioPlayerStatus.Idle, () => {
    console.log("⏹ Đã phát xong");
});


player.on("error", err => {
    console.log("PLAYER ERROR:", err);
});

player.on(AudioPlayerStatus.Idle, () => {

    if(isPlaying) {

        setTimeout(() => {
            playNext(lastMessage);
        },1000);

    }

});




// BOT ONLINE

client.once("clientReady", () => {

    console.log(`✅ Online: ${client.user.tag}`);


    const guild = client.guilds.cache.get("1490675219893850152");

    if (!guild) {
        console.log("❌ Không tìm thấy server");
        return;
    }


    const voice = guild.channels.cache.get("1531267183018246224");


    if (!voice) {
        console.log("❌ Không tìm thấy voice");
        return;
    }


    connection = joinVoiceChannel({

        channelId: voice.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute:false,
        selfDeaf:false

    });


    connection.subscribe(player);


    console.log("🔊 Bot đã vào voice");

});

async function playNext(message) {

    if(musicQueue.length === 0) {

        isPlaying = false;
        return;

    }


    isPlaying = true;


    const song = musicQueue.shift();


    const ytdlp = spawn(
        "yt-dlp.exe",
        [
            "-f",
            "bestaudio",
            "--no-playlist",
            "-o",
            "-",
            song.url
        ]
    );


    const resource = createAudioResource(
        ytdlp.stdout,
        {
            inputType: StreamType.Arbitrary
        }
    );


    player.play(resource);


    connection.subscribe(player);


    message.channel.send(
        `🎵 Đang phát: **${song.name}**`
    );


}




// TIN NHẮN

client.on("messageCreate", async message => {


    if(message.author.bot) return;



    // AUTO REPLY

    const replies = {

        "bốm cảe":"j",

        "spicy me":"kêu con ngục <@1312612784600645693> lên gặp chị",

        "phát":"<@1405032456356106342>",

        "ngu":"ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu ngu "

    };


    const text = message.content.toLowerCase();


    if(replies[text]) {

        message.reply(replies[text]);

    }





    if(!message.content.startsWith(prefix)) return;



    const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/);



    const command = args.shift().toLowerCase();





    // JOIN VOICE

    if(command === "join") {


        const channel = message.member.voice.channel;


        if(!channel)
            return message.reply("❌ Vào voice trước!");



        connection = joinVoiceChannel({

            channelId: channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfMute:false,
            selfDeaf:false

        });



        connection.subscribe(player);


        return message.reply("✅ Bot đã vào voice");

    }





    // KICK


    if(command === "kick") {


        if(!message.member.permissions.has(
            PermissionsBitField.Flags.KickMembers
        ))

        return message.reply("❌ Không có quyền");



        const member = message.mentions.members.first();


        if(!member)
            return message.reply("❌ Tag người cần kick");



        await member.kick();


        return message.reply(
            `✅ Đã kick ${member.user.tag}`
        );

    }





    // BAN


    if(command === "ban") {


        if(!message.member.permissions.has(
            PermissionsBitField.Flags.BanMembers
        ))

        return message.reply("❌ Không có quyền");



        const member = message.mentions.members.first();


        if(!member)
            return message.reply("❌ Tag người cần ban");



        await member.ban();


        return message.reply(
            `✅ Đã ban ${member.user.tag}`
        );

    }
	
	
	
	 // =====================
    // PING START
    // =====================

    if(command === "pingstart") {


        const user = message.mentions.users.first();


        if(!user)
            return message.reply("❌ Tag người cần ping");



        if(pingLoop)
            return message.reply("❌ Đang có ping chạy");



        pingLoop = setInterval(async()=>{


            if(!pingLoop) return;


            await message.channel.send(`${user}`);


        },800);



        return message.reply("✅ Đã bật ping");

    }





    // =====================
    // PING STOP
    // =====================

    if(command === "pingstop") {


        if(!pingLoop)
            return message.reply("❌ Không có ping");



        clearInterval(pingLoop);


        pingLoop = null;



        return message.reply("🛑 Đã dừng ping");

    }





    // =====================
    // SOI TÀI KHOẢN
    // =====================

    if(command === "soi") {


        const user =
            message.mentions.users.first()
            || message.author;



        const member =
            message.guild.members.cache.get(user.id);



        const embed = new EmbedBuilder()


        .setColor("Blue")


        .setTitle(`🔍 Soi ${user.username}`)


        .setThumbnail(
            user.displayAvatarURL({
                dynamic:true,
                size:1024
            })
        )


        .addFields(

            {
                name:"👤 Tag",
                value:user.tag
            },


            {
                name:"🆔 ID",
                value:user.id
            },


            {
                name:"🤖 Bot",
                value:user.bot ? "Có":"Không"
            },


            {
                name:"📅 Tạo lúc",
                value:
                `<t:${Math.floor(user.createdTimestamp/1000)}:F>`
            },


            {
                name:"📥 Vào server",
                value:
                member ?
                `<t:${Math.floor(member.joinedTimestamp/1000)}:F>`
                :
                "Không rõ"
            }

        )


        .setImage(
            user.displayAvatarURL({
                dynamic:true,
                size:1024
            })
        );




        const button =
        new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()

            .setLabel("Avatar HD")

            .setStyle(ButtonStyle.Link)

            .setURL(
                user.displayAvatarURL({
                    dynamic:true,
                    size:4096
                })
            )

        );



        return message.reply({

            embeds:[embed],

            components:[button]

        });


    }





    // =====================
    // SAY VOICE
    // =====================

    if(command === "say") {


        if(!connection)
            return message.reply("❌ Bot chưa ở voice");


        const text = args.join(" ");


        if(!text)
            return message.reply("❌ Nhập nội dung");



        try{


            const file = await createVoice(text);



            const resource = createAudioResource(
                file,
                {
                    inputType: StreamType.Arbitrary
                }
            );



            player.play(resource);



            return message.reply(
                "🎤 Đã đọc: " + text
            );



        }catch(err){

            console.log("SAY ERROR:",err);

        }

    }





    // =====================
    // HELP
    // =====================

    if(command === "help"){


        const embed = new EmbedBuilder()


        .setColor("Blue")


        .setTitle("📖 Lệnh Bot")


        .setDescription(`

🛠 Quản lý

!kick @user
!ban @user


🎤 Voice

!join
!say nội dung


🔍 Tiện ích

!soi @user
!snipe


📢 Ping

!pingstart @user
!pingstop

        `);



        return message.reply({
            embeds:[embed]
        });


    }





    // =====================
    // SNIPE
    // =====================

    if(command === "snipe"){


        const data =
        deletedMessages.get(message.guild.id);



        if(!data)

            return message.reply(
                "❌ Không có tin nhắn"
            );



        const embed = new EmbedBuilder()


        .setColor("DarkBlue")


        .setTitle("🕵️ Tin nhắn bị xóa")


        .setAuthor({

            name:data.author,

            iconURL:data.avatar

        })


        .setDescription(
            data.content || "*Không có nội dung*"
        )


        .setFooter({

            text:
            "Xóa lúc " +
            new Date(data.time)
            .toLocaleString("vi-VN")

        });



        return message.reply({
            embeds:[embed]
        });


    }
	
	// =====================
// MUTE / UNMUTE VOICE
// =====================

// Mute mic
if(command === "mute") {

    if(!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
        return message.reply("❌ Bạn không có quyền mute!");
    }


    const member = message.mentions.members.first();


    if(!member) {
        return message.reply("❌ Hãy tag người cần mute!");
    }


    if(!member.voice.channel) {
        return message.reply("❌ Người này không ở trong voice!");
    }


    try {

        await member.voice.setMute(true);

        message.reply(`🔇 Đã mute ${member.user.tag}`);

    } catch(err) {

        console.log("MUTE ERROR:", err);

        message.reply("❌ Không thể mute người này!");

    }

}



// Unmute mic
if(command === "unmute") {

    if(!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
        return message.reply("❌ Bạn không có quyền unmute!");
    }


    const member = message.mentions.members.first();


    if(!member) {
        return message.reply("❌ Hãy tag người cần unmute!");
    }


    try {

        await member.voice.setMute(false);

        message.reply(`🔊 Đã unmute ${member.user.tag}`);

    } catch(err) {

        console.log("UNMUTE ERROR:", err);

        message.reply("❌ Không thể unmute người này!");

    }

}

	
// =====================
// STOP NHẠC
// =====================

if(command === "stop") {

    if(!player) {
        return message.reply("❌ Không có nhạc đang phát!");
    }


    player.stop();


    message.reply("⏹ Đã dừng nhạc!");

}
	

// =====================
// PLAY NHẠC
// =====================

if(command === "play") {

    if(!connection) {
        return message.reply("❌ Bot chưa ở voice!");
    }


    const url = args[0];


    if(!url) {
        return message.reply("❌ Gửi link!");
    }


    try {

        // Spotify playlist

        if(url.includes("spotify.com/playlist")) {


            const playlistId = url
                .split("playlist/")[1]
                .split("?")[0];


            const playlist = await play.spotify(url);

if(!playlist || !playlist.fetched_tracks.length) {
    return message.reply("❌ Playlist không có bài!");
}

message.reply(
    `🎶 Đang tải playlist: ${playlist.title} (${playlist.fetched_tracks.length} bài)`
);


for(const track of playlist.fetched_tracks) {

    const searchText =
        `${track.name} ${track.artists[0].name}`;


    const result = await play.search(
        searchText,
        {
            limit: 1
        }
    );


    if(result.length) {

        musicQueue.push({
            name: searchText,
            url: result[0].url
        });

    }

}


if(!isPlaying) {
    playNext(message);
}

return;


            console.log(
                "Số bài:",
                data.body.items.length
            );


            return message.reply(
                `🎶 Đã đọc playlist: ${data.body.items.length} bài`
            );


        }


        return message.reply("⏳ Đây chưa phải playlist Spotify");


    }     catch(err) {

    console.log(
        "SPOTIFY ERROR FULL:",
        err
    );


    return message.reply(
        "❌ Không đọc được playlist Spotify!"
    );

}

}

});




// LƯU TIN NHẮN XÓA

client.on("messageDelete", message=>{


    if(!message.guild) return;


    if(message.author?.bot) return;



    deletedMessages.set(

        message.guild.id,

        {

            author:message.author.tag,

            avatar:
            message.author.displayAvatarURL(),

            content:message.content,

            time:Date.now()

        }

    );

});




// TOKEN
client.login(process.env.TOKEN);
