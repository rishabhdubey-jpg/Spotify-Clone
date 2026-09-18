console.log('Lets write JavaScript');
let currentSong = new Audio();
let currFolder;
let songs = [];
let currentSongIndex = 0;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;

    // Reset song index whenever a playlist is loaded
    currentSongIndex = 0;

    let a = await fetch(`/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");

    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];

        if (element.href.toLowerCase().endsWith(".mp3")) {
            let track = element.textContent.trim();
            songs.push(track);
        }
    }

    console.log("Folder:", folder);
    console.log("Songs found:", songs);

    // Show all the songs in the playlist
    let songUL = document
        .querySelector(".songList")
        .getElementsByTagName("ul")[0];

    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML += `
<li data-index="${songs.indexOf(song)}">
    <img class="invert" width="30" src="img/music.svg" alt="">

    <div class="info">
        <div>${song.replace(".mp3", "")}</div>
        <div>${currFolder.split("/").pop()}</div>
    </div>

    <div class="playnow">
                        <span>Play now</span>

                        <div class="playIcon">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none">

                                <!-- White circle -->
                                <circle cx="12" cy="12" r="12" fill="white" />

                                <!-- Official Spotify play triangle, scaled and centered -->
                                <path
                                    d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288z"
                                    fill="black"
                                    transform="translate(3 3) scale(1.125)"
                                />

                            </svg>
                        </div>
                    </div>

</li>`;
    }

    // Attach an event listener to each song
    Array.from(
        document.querySelector(".songList").getElementsByTagName("li")
    ).forEach(e => {
        e.addEventListener("click", () => {
            const track = e.querySelector(".info").firstElementChild.innerHTML.trim();

            currentSongIndex = Number(e.dataset.index);
            playMusic(songs[currentSongIndex]);
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/${encodeURIComponent(track)}`;

    console.log("Playing:", currentSong.src);

    // Song name
    document.querySelector(".songinfo").innerHTML = track.replace(".mp3", "");

    // Artist / Playlist name (if exists in new HTML)
    const artist = document.querySelector(".artistName");
    if (artist) {
        artist.innerHTML = currFolder.split("/").pop();
    }

    // Album cover (if exists in new HTML)
    const albumArt = document.getElementById("albumArt");
    if (albumArt) {
        albumArt.src = `/${currFolder}/cover.jpg`;
    }

    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // Highlight current song
    document.querySelectorAll(".songList li").forEach((li, index) => {
        li.classList.toggle("activeSong", index === currentSongIndex);
    });

    if (!pause) {
        currentSong.play().catch(err => console.log(err));
        play.src = "img/pause.svg";
    }
};

async function displayAlbums() {
    console.log("Displaying albums");

    // Fetch all album folders
    let a = await fetch("/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = Array.from(div.getElementsByTagName("a"));
    let cardContainer = document.querySelector(".cardContainer");

    // Clear old cards
    cardContainer.innerHTML = "";

    // Loop through all folders
    for (let e of anchors) {

        // Ignore parent directory and .htaccess
        const path = new URL(e.href).pathname;

        if (path === "/" || path.includes(".htaccess")) {
            continue;
        }

        // Windows Live Server returns \songs\FolderName
        let folder = decodeURIComponent(e.href)
            .replace(/\\/g, "/")
            .split("/")
            .filter(Boolean)
            .pop();

        console.log("Found folder:", folder);

        try {
            // Fetch album metadata
            let info = await fetch(`/songs/${encodeURIComponent(folder)}/info.json`);

            if (!info.ok) continue;

            let metadata = await info.json();

            // Generate album card
            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M5 20V4L19 12L5 20Z"
                                stroke="#141B34"
                                fill="#000"
                                stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>

                    <img src="/songs/${encodeURIComponent(folder)}/cover.jpg" alt="${metadata.title}">
                    <h2>${metadata.title}</h2>
                    <p>${metadata.description}</p>
                </div>
            `;
        } catch (err) {
            console.log("Skipping folder:", folder, err);
        }
    }

    console.log("Total albums generated:", document.querySelectorAll(".card").length);

    // Load playlist when a card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (item) => {
            console.log("Fetching Songs");

            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);

            currentSongIndex = 0;

            playMusic(songs[currentSongIndex]);
        });
    });
}

async function main() {
    // Get the list of all the songs
    await getSongs("songs/SeedheMaut");
    currentSongIndex = 0;
    playMusic(songs[currentSongIndex], true);

    await displayAlbums();


    // Attach an event listener to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        }
        else {
            currentSong.pause()
            play.src = "img/play.svg"
        }
    })

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {

        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

        const circle = document.querySelector(".circle");

        if (!isNaN(currentSong.duration)) {
            circle.style.left =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    currentSong.addEventListener("ended", () => {
        currentSongIndex++;

        if (currentSongIndex >= songs.length) {
            currentSongIndex = 0;
        }

        playMusic(songs[currentSongIndex]);
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        console.log("Previous clicked");

        if (songs.length === 0) return;

        currentSongIndex--;

        if (currentSongIndex < 0) {
            currentSongIndex = songs.length - 1;
        }

        console.log("Current index:", currentSongIndex);
        console.log("Previous song:", songs[currentSongIndex]);

        playMusic(songs[currentSongIndex]);
    });

    // Add an event listener to next
    next.addEventListener("click", () => {
        console.log("Next clicked");

        if (songs.length === 0) return;

        currentSongIndex++;

        if (currentSongIndex >= songs.length) {
            currentSongIndex = 0;
        }

        console.log("Current index:", currentSongIndex);
        console.log("Next song:", songs[currentSongIndex]);

        playMusic(songs[currentSongIndex]);
    });

    // Add an event to volume
    const volumeSlider = document.querySelector(".range input");

    volumeSlider.value = 100;

    volumeSlider.addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
    });

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }

    })





}

main() 