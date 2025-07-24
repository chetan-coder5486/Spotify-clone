
let currentSong = new Audio()
let songUl = document.querySelector(".song-cards").getElementsByTagName("ul")[0];
let songs = []

async function getsongs(folder) {
    let a = await fetch(`assets/songs/${folder}`);
    let response = await a.text();
    console.log(response);
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith("mp3")) {
            songs.push(element.href);
        }
    }
    return songs
}

async function createSongCard(folder) {
    let songs = await getsongs(folder);
    ;
}

function updateCurrentSongDisplay() {

    if (!currentSong.src) {
        document.querySelector(".current-song-info").textContent = "Select a song to play";
    } else {
        const songName = currentSong.src.split("/").pop().replace(".mp3", "").replaceAll("%20", " ");
        document.querySelector(".current-song-info").textContent = songName;
        document.querySelector(".current-song-info").title = songName;

    }
    songUl.querySelectorAll(".song-card").forEach(card => {
        if (card.dataset.song === currentSong.src) {
            card.classList.add("playing");
            if (card.innerHTML.indexOf("Now Playing") === -1) {
                card.innerHTML += `<div class="now-playing">Now Playing</div>`;
            }
        } else {
            card.classList.remove("playing");
            const nowPlayingDiv = card.querySelector(".now-playing");
            if (nowPlayingDiv) {
                nowPlayingDiv.remove();
            }
        }
    });
}

async function main() {

    const play = document.getElementById("play");
    const prev = document.getElementById("prev");
    const next = document.getElementById("next");
    const playlistCards = document.querySelector(".playlist-cards");
    if (!playlistCards) {
        console.error("Element .playlist-cards not found.");
        return;
    }
    let a = await fetch("assets/songs"); // Corrected IP
    let response = await a.text();
    // console.log(response);

    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    // console.log(anchors);


    // Use Promise.all to fetch all info.json files concurrently for better performance
    const cardPromises = Array.from(anchors).filter(element => element.href.includes("/songs")).map(async (element) => {
        // --- FIX 1: Correctly get the folder name ---
        const urlParts = element.href.split('/');
        const folderName = urlParts[urlParts.length - 2]; // Get the second-to-last part

        try {
            let b = await fetch(`assets/songs/${folderName}/info.json`);
            let cardInfo = await b.json();

            // --- FIX 2: Apply the style directly in the HTML string ---
            return `<div class="playlist-card" data-folder="${folderName}">
                        <div class="thumbnail" style="background-image: url('assets/songs/${folderName}/thumbnail.jpg')">
                            <img class="play-btn" src="assets/images/play.svg" alt="play">
                        </div>
                        <div class="title small bold-600 white-text">${cardInfo.title}</div>
                        <div class="description smaller gray-text" title = "${cardInfo.description}">${cardInfo.description}</div>
                    </div>`;
        } catch (error) {
            console.error("Failed to load playlist card for:", folderName, error);
            return ""; // Return empty string if a card fails to load
        }
    });

    const cardHtmlArray = await Promise.all(cardPromises);
    playlistCards.innerHTML = cardHtmlArray.join('');


    playlistCards.addEventListener("click", async (event) => {
        const target = event.target.closest(".playlist-card");
        if (target) {
            const folder = target.dataset.folder;
            console.log("Selected folder:", folder);
            songs = await getsongs(folder);

            // 2. Create the HTML for the song cards
            let html = "";
            for (const song of songs) {
                let filename = decodeURIComponent(song.split("/").pop().replace(".mp3", ""));
                let parts = filename.split("-");
                let songName = (parts[0] || "Unknown Song").trim();
                let songCreator = (parts[1] || "Unknown Artist").trim();
                html += `<li>
                    <div class="song-card flex" data-song="${song}">
                        <img class="music" src="assets/images/music.svg" alt="">
                        <div class="song-info">
                            <div class="song-name">${songName}</div>
                            <div class="song-creator">${songCreator}</div>
                        </div>
                    </div>
                </li>`;
            }
            songUl.innerHTML = html;
            // console.log(songUl)
            // 3. Load the first song but don't play it
            if (songs.length > 0) {
                currentSong.src = songs[0];
                play.src = "assets/images/play2.svg";
                document.querySelector(".seekbar .circle").style.left = "0%";
                document.querySelector(".current-time").textContent = "0:00";
                document.querySelector(".total-time").textContent = "0:00";
            }
        }
    });



    // Add event listeners to song cards
    songUl.addEventListener("click", (event) => {
        const songCard = event.target.closest(".song-card");   
        if (songCard) {
            const songSrc = songCard.dataset.song;
            if (songSrc) {
                currentSong.src = songSrc;
                play.src = "assets/images/pause.svg"; // Change play button to pause
                currentSong.play(); // Play the selected song
                updateCurrentSongDisplay(); // Update the display with the current song
            } else {
                console.error("No song source found in the clicked card.");
            }
        }
    });




    currentSong.addEventListener("loadedmetadata", updateCurrentSongDisplay);
    updateCurrentSongDisplay();

    //add event listener for volume
    const volumeSlider = document.querySelector(".volume-slider");
    const volumeIcon = document.querySelector(".volume-icon");

    // Use the 'input' event for volume control
    volumeSlider.addEventListener("input", () => {
        let newVolume = volumeSlider.value / 100;
        currentSong.volume = newVolume;

        if (volumeSlider.value == 0) {
            volumeIcon.src = "assets/images/mute.svg";
        } else {
            volumeIcon.src = "assets/images/volume.svg";
        }
    });

    volumeIcon.addEventListener("click", (e) => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            volumeSlider.value = 0;
            e.target.src = "assets/images/mute.svg";
        }
        else {
            currentSong.volume = 0.1;
            volumeSlider.value = 10; // Convert to percentage
            e.target.src = "assets/images/volume.svg";

        }
    });

    // Add event listeners for play, pause, next, and previous buttons

    play.addEventListener("click", () => {
        if (currentSong.src === "") {
            console.log("No song selected to play.");
            return;
        }
        if (currentSong.paused) {
            currentSong.play();
            play.src = "assets/images/pause.svg";
        } else {
            currentSong.pause();
            play.src = "assets/images/play2.svg";
        }
    });
    currentSong.addEventListener("ended", () => {
        play.src = "assets/images/play2.svg"; // Reset play button icon when song ends
        console.log("Song ended.");
    });

    prev.addEventListener("click", () => {
        if (songs.length === 0) return;
        let currentIndex = songs.findIndex(s => s === currentSong.src);
        if (currentIndex === -1) return; // Song not found

        const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
        currentSong.src = songs[prevIndex];
        currentSong.play();
        play.src = "assets/images/pause.svg";
    });

    next.addEventListener("click", () => {
        if (songs.length === 0) return;
        let currentIndex = songs.findIndex(s => s === currentSong.src);
        if (currentIndex === -1) return;

        const nextIndex = (currentIndex + 1) % songs.length;
        currentSong.src = songs[nextIndex];
        currentSong.play();
        play.src = "assets/images/pause.svg";
    });

    currentSong.addEventListener("timeupdate", () => {
        const currentTime = document.querySelector(".current-time");
        const totalTime = document.querySelector(".total-time");
        const seekbar = document.querySelector(".seekbar .circle");

        // Update current time
        let minutes = Math.floor(currentSong.currentTime / 60);
        let seconds = Math.floor(currentSong.currentTime % 60);
        currentTime.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

        // Update total time
        if (currentSong.duration) {
            let totalMinutes = Math.floor(currentSong.duration / 60);
            let totalSeconds = Math.floor(currentSong.duration % 60);
            totalTime.textContent = `${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds}`;
        }

        // Update seekbar position
        if (currentSong.duration) {
            const percentage = (currentSong.currentTime / currentSong.duration) * 100;
            seekbar.style.left = `calc(${percentage}% - 10px)`; // Adjust for circle size
        }
    });

    // Seekbar functionality

    const seekbar = document.querySelector(".seekbar");
    seekbar.addEventListener("click", (event) => {
        const seekbarWidth = event.currentTarget.clientWidth;
        const clickX = event.clientX - event.currentTarget.getBoundingClientRect().left;
        const newTime = (clickX / seekbarWidth) * currentSong.duration;
        currentSong.currentTime = newTime;
    });

    // Hover effects for song cards

    songUl.addEventListener("mouseover", (event) => {
        const songCard = event.target.closest(".song-card");
        if (songCard) {
            const musicElement = songCard.querySelector(".music");
            if (musicElement) {
                musicElement.src = "assets/images/play.svg";
            }
        }
    });

    songUl.addEventListener("mouseout", (event) => {
        const songCard = event.target.closest(".song-card");
        if (songCard) {
            const musicElement = songCard.querySelector(".music");
            if (musicElement) {
                musicElement.src = "assets/images/music.svg";
            }
        }
    });

    // Add event listener for the more button
    const moreButton = document.querySelector(".more");
    moreButton.addEventListener("click", () => {
        const navItems = document.querySelector(".nav-items-mobile>ul");
        if (navItems.style.display === "block") {
            navItems.style.display = "none";
        } else {
            navItems.style.display = "block";
        }
    });

    // Add event listener for the hamburger menu
    const menu = document.querySelector(".menu");
    const libContainer = document.querySelector(".lib-container");

    menu.addEventListener("click", () => {
        console.log("Hamburger menu clicked");
        libContainer.classList.toggle("is-open");
    });
}

main();
