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
    currentSongIndex = 0;

    // Read songs from albums.json instead of folder listing
    const res = await fetch("/songs/albums.json");
    const albums = await res.json();

    const album = albums.find(a => `songs/${a.folder}` === folder);

    if (!album) {
        songs = [];
        return songs;
    }

    songs = album.songs;

    console.log("Folder:", folder);
    console.log("Songs found:", songs);

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    songs.forEach((song, index) => {
        songUL.innerHTML += `
        <li data-index="${index}">
            <img class="invert" width="30" src="img/music.svg" alt="">

            <div class="info">
                <div>${song.replace(".mp3","")}</div>
                <div>${album.title}</div>
            </div>

            <div class="playnow">
                <span>Play now</span>

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
            </div>
        </li>`;
    });

    document.querySelectorAll(".songList li").forEach(li => {
        li.addEventListener("click", () => {
            currentSongIndex = Number(li.dataset.index);
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

    const res = await fetch("/songs/albums.json");
    const albums = await res.json();

    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    albums.forEach(album => {

        cardContainer.innerHTML += `
        <div class="card" data-folder="${album.folder}">

            <div class="play">
                <img src="img/play.svg" alt="">
            </div>

            <img src="/songs/${album.folder}/${album.cover}" alt="${album.title}">

            <h2>${album.title}</h2>
            <p>${album.description}</p>

        </div>`;
    });

    document.querySelectorAll(".card").forEach(card => {

        card.addEventListener("click", async () => {

            songs = await getSongs(`songs/${card.dataset.folder}`);

            currentSongIndex = 0;
            playMusic(songs[0]);

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