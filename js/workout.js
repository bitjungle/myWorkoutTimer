/**
 * myWorkoutTimer
 *
 * Copyright (C) 2020-2021 BITJUNGLE Rune Mathisen
 * This code is licensed under a GPLv3 license 
 * See http://www.gnu.org/licenses/gpl-3.0.html 
 */

//  HTMLElement objects
const PROGRESSBAR = document.querySelector("#progressbar");
const STARTSTOPBUTTON = document.querySelector("#startstop");
const TIMERTXT = document.querySelector("#timertxt");
const TIMERBOX = document.querySelector("#timerbox");
const WORKTXT = document.querySelector("#worktxt");
const WORKBOX = document.querySelector("#workbox");
const FEEDBACKTXT = document.querySelector("#feedbacktxt");
const DING = document.querySelector("#ding");
const DINGDING = document.querySelector("#dingding");
const DINGDINGDING = document.querySelector("#dingdingding");
const TICKTOCK = document.querySelector("#ticktock");
const WOODENDING = document.querySelector("#woodending");
const INPUT_AREA = document.querySelector("#inputarea");
const IN_REPS = document.querySelector("#input_reps");
const IN_REPS_VAL = document.querySelector("#input_reps_val");
const IN_AMRAP = document.querySelector("#input_amrap");
const IN_TIME_CAP = document.querySelector("#input_time_cap");
const IN_AMRAP_MINS = document.querySelector("#input_amrap_mins");
const IN_TIME_CAP_MINS = document.querySelector("#input_time_cap_mins");

// Global constants
const TIMERINTERVAL = 1000; // milliseconds

// Global objects
let timerSettings = {
    warmup: null,
    work: null,
    rest: null,
    reps: null,
    cooldown: null,
    cap: null
};
let timer = {
    function: null, // timer function for the selected workout type
    type: null,     // emom/amrap/time/tabata/hiit
    state: 'pre',   // pre/warmup/work/rest/cooldown/end - NOT IN USE
    started: false, // true/false
    rep: 0,         // rep counter
    secs: 0         // elapsed time since start
};

// Get the selected workout type, default is 'time'.
let params = (new URL(document.location)).searchParams;
timer.type = params.get("type") === null ? 'time' : params.get("type");

// ============================= FUNCTIONS =============================

/**
 * Handle a start/stop button event
 * 
 * @param {Object} e - event data
 */
function toggleStartStopButton() {
    if (timer.started) {
        timer.started = false;
        clearInterval(timerID);
        updateFeedbackText("Workout stopped!");
        updateStartStopButtonFace(timer.started);
    } else {
        timer.started = true;
        timer.rep = 0;
        getUserInput();
        updateFeedbackText("Starting...");
        updateStartStopButtonFace(timer.started);
        timerID = setInterval(timer.function, TIMERINTERVAL, Date.now());
        WOODENDING.play();
    }
};

/**
 * Timer interval function for the 'time' workout type
 * 
 * @param {number} startTime - the workout start time
 */
function timerTime(startTime) {
    // Calculate elapsed time in seconds since start
    timer.secs = timeElapsed(startTime);
    if (timer.secs > (timerSettings.cap + timerSettings.warmup)) {
        toggleStartStopButton();
        TIMERBOX.classList.remove('w3-dark-grey', 'w3-yellow', 'w3-light-green');
        TIMERBOX.classList.add('w3-red');
        updateFeedbackText("Finished!");
        DINGDINGDING.play();
    } else if (timer.secs < timerSettings.warmup) {
        if (timer.secs == 1) {
            updateFeedbackText("Workout starting soon...");
        } else if (timer.secs == 5) {
            TIMERBOX.classList.remove('w3-dark-grey');
            TIMERBOX.classList.add('w3-yellow');
            updateFeedbackText('Get ready!');
            TICKTOCK.play();
        } else {
            //
        }
        updateTimerText(timerSettings.warmup - timer.secs);
    } else {
        if (timer.secs == timerSettings.warmup) {
            TIMERBOX.classList.remove('w3-yellow');
            TIMERBOX.classList.add('w3-light-green');
            updateFeedbackText('Work! Time cap is ' + timerSettings.cap / 60 + ' minutes.');
            DING.play();
        }
        updateTimerText(timer.secs - timerSettings.warmup);
        updateProgressbar(Math.round(100 * (timer.secs - timerSettings.warmup) / timerSettings.cap));
    }
};

/**
 * Timer interval function for the 'amrap' workout type
 * 
 * @param {number} startTime - the workout start time
 */
function timerAmrap(startTime) {
    // Calculate remaining time in seconds
    timer.secs = timeElapsed(startTime);
    let remaining = timerSettings.work - timer.secs + timerSettings.warmup;

    if (remaining > timerSettings.work) {
        updateFeedbackText("Workout starting soon...");        
        updateTimerText(remaining - timerSettings.work);
        if (remaining < (timerSettings.work + 6)) {
            TIMERBOX.classList.remove('w3-dark-grey');
            TIMERBOX.classList.add('w3-yellow');
            updateFeedbackText('Get ready!');
            TICKTOCK.play();
        }
    } else {
        updateProgressbar(Math.round(100 * (1 - remaining / timerSettings.work)));
        updateTimerText(remaining);
        if (remaining == timerSettings.work) {
            TIMERBOX.classList.remove('w3-yellow');
            TIMERBOX.classList.add('w3-light-green');
            DING.play();
        }
        if (remaining < 60) {
            if (remaining <= 0) {
                toggleStartStopButton();
                TIMERBOX.classList.remove('w3-dark-grey', 'w3-yellow', 'w3-light-green');
                TIMERBOX.classList.add('w3-red');
                updateFeedbackText("Finished!");
                DINGDINGDING.play();
            } else {
                TIMERBOX.classList.remove('w3-dark-grey', 'w3-light-green');
                TIMERBOX.classList.add('w3-yellow');
                updateFeedbackText("Less than 60 secs left!");
                TICKTOCK.play();
            }
        } else {
            updateFeedbackText('Work!');
        }
    }
};

/**
 * Timer interval function for the 'emom' workout type
 * 
 * @param {number} startTime - the workout start time
 */
function timerEmom(startTime) {
    // Calculate elapsed time in seconds since start
    timer.secs = timeElapsed(startTime) - timerSettings.warmup;
    updateProgressbar(Math.round(100 * timer.secs / (timerSettings.cap - timerSettings.warmup)));
    if (timer.secs >= timerSettings.work * timer.rep) { // new rep or finish
        if (timer.rep == timerSettings.reps) {
            toggleStartStopButton();
            TIMERBOX.classList.remove('w3-dark-grey', 'w3-yellow');
            TIMERBOX.classList.add('w3-red');
            updateFeedbackText("Finished!");
            DINGDINGDING.play();
        } else if (timer.secs < 0) {
            TIMERBOX.classList.remove('w3-dark-grey', 'w3-light-green');
            TIMERBOX.classList.add('w3-yellow');
            updateFeedbackText("Get ready!");
        } else {
            timer.rep++;
            updateFeedbackText('Rep ' + timer.rep + '/' + timerSettings.reps);
            TIMERBOX.classList.remove('w3-dark-grey', 'w3-yellow');
            TIMERBOX.classList.add('w3-light-green');
            DING.play();
        }
    }
    let remainingInRep = (timerSettings.work * timer.rep) - timer.secs;
    updateTimerText(remainingInRep);
    if (timer.secs < 0) {
        updateFeedbackText("Workout starting soon...");
    }
    if (remainingInRep < 6) {
        TIMERBOX.classList.remove('w3-light-green', 'w3-dark-grey');
        TIMERBOX.classList.add('w3-yellow');
        if (timer.rep < timerSettings.reps) updateFeedbackText("Get ready!");
        TICKTOCK.play();
    }
};

/**
 * Timer interval function for the 'tabata' workout type
 * 
 * @param {number} startTime - the workout start time
 */
function timerHiit(startTime) {
    // Calculate elapsed time in seconds since start
    timer.secs = timeElapsed(startTime);
    updateProgressbar(Math.round(100 * timer.secs / timerSettings.cap));
    if (timer.secs >= (timerSettings.warmup + (timerSettings.work + timerSettings.rest) * timer.rep)) {
        // We have just finished a work+rest period, figure out what to do next
        if (timer.rep == timerSettings.reps) {
            // We have completed all the reps
            if (timerSettings.cooldown != 0 && timer.secs < timerSettings.cap) {
                // There is a cooldown period set for this workout
                if (timer.secs == (timerSettings.cap - timerSettings.cooldown)) {
                    updateFeedbackText("Cooldown");
                    TIMERBOX.classList.remove('w3-red', 'w3-dark-grey', 'w3-light-green');
                    TIMERBOX.classList.add('w3-yellow');
                    DINGDING.play();
                }
            } else {
                // We are done, wrap it up
                toggleStartStopButton();
                TIMERBOX.classList.remove('w3-dark-grey', 'w3-yellow', 'w3-light-green');
                TIMERBOX.classList.add('w3-red');
                updateFeedbackText("Finished!");
                DINGDINGDING.play();
            }
        } else {
            // We are starting a new rep
            timer.rep++;
            updateFeedbackText('WORK! Round: ' + timer.rep + '/' + timerSettings.reps);
            TIMERBOX.classList.remove('w3-red', 'w3-dark-grey', 'w3-yellow');
            TIMERBOX.classList.add('w3-light-green');
            DING.play();
        }
    } else if (timerSettings.warmup != 0 && timer.secs < timerSettings.warmup) {
        // We are in a warmup period
        if (timer.secs == 1) {
            if (timerSettings.warmup <= 10) {
                updateFeedbackText("Workout starting soon...");
            } else {
                updateFeedbackText("Warmup");
                TIMERBOX.classList.remove('w3-red', 'w3-dark-grey', 'w3-light-green');
                TIMERBOX.classList.add('w3-yellow');
            }
        }
    } else {
        // Do nothing
    }

    let remainingInRep = timerSettings.warmup + ((timerSettings.work + timerSettings.rest) * timer.rep) - timer.secs;
    console.log('rep: ', timer.rep, ' delta: ', timer.secs, ' remaining: ', remainingInRep);
    if (remainingInRep <= timerSettings.rest) {
        if (remainingInRep == timerSettings.rest && remainingInRep > 0) {
            // Work completed, entering a rest period
            TIMERBOX.classList.remove('w3-yellow', 'w3-dark-grey', 'w3-light-green');
            TIMERBOX.classList.add('w3-red');
            updateFeedbackText("Rest... " + timer.rep + " rounds completed");
            DINGDING.play();
        } else if (remainingInRep < 6 && remainingInRep > 0 && timer.rep < timerSettings.reps) {
            // Starting a new rep in 5 seconds
            if (remainingInRep == 5) {
                TIMERBOX.classList.remove('w3-red', 'w3-dark-grey', 'w3-light-green');
                TIMERBOX.classList.add('w3-yellow');
                updateFeedbackText("Get ready!");
                TICKTOCK.play();
            }
        } else {
            // Ongoing warmup, cooldown or rest period
            if (timerSettings.cooldown > 0 && remainingInRep < 0) {
                remainingInRep += timerSettings.cooldown;
            }
        }
        // We are in a resting period, counting down
        updateTimerText(remainingInRep);
    } else {
        // We are in a working period, counting down
        updateTimerText(remainingInRep - timerSettings.rest);
    }
};

/**
 * Return elapsed time in seconds since a specified start time
 * 
 * @param {number} startTime - seconds 
 */
function timeElapsed(startTime) {
    return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Convert seconds to HH:MM:SS
 * 
 * @param {number} secs - seconds to convert
 */
function secsToHMS(secs) {
    let measuredTime = new Date(null);
    measuredTime.setSeconds(secs);
    return measuredTime.toISOString().substr(11, 8);
};

/**
 * Update the progress bar display
 * 
 * @param {number} progress - progress in percent
 */
function updateProgressbar(progress) {
    if (progress < 0) progress = 0;
    let pStr = String(progress + '%');
    PROGRESSBAR.style.width = PROGRESSBAR.innerHTML = pStr;
};

/**
 * Update the timer display
 * 
 * @param {number} timerValue - Value in seconds
 */
function updateTimerText(timerValue) {
    TIMERTXT.innerHTML = secsToHMS(timerValue);
};

/**
 * Update the feedback display
 * 
 * @param {string} txt - String to display
 */
function updateFeedbackText(txt) {
    console.log(txt);
    FEEDBACKTXT.innerHTML = txt;
};

/**
 * Update the workout title display
 * 
 * @param {string} txt 
 */
function updateWorkoutText(txt) {
    console.log(txt);
    WORKTXT.innerHTML = txt.toUpperCase();
};

/**
 * Update the start/stop button face
 * 
 * @param {bool} playing 
 */
function updateStartStopButtonFace(playing) {
    if (playing) {
        STARTSTOPBUTTON.innerHTML = '&#9632;'; //BLACK SQUARE
        STARTSTOPBUTTON.classList.remove('w3-light-green');
        STARTSTOPBUTTON.classList.add('w3-red');
    } else {
        STARTSTOPBUTTON.innerHTML = '&#9658;'; //BLACK RIGHT-POINTING POINTER
        STARTSTOPBUTTON.classList.remove('w3-red');
        STARTSTOPBUTTON.classList.add('w3-light-green');
    }
};

/**
 * Get the user inputs for workout customisation and hide the input area.
 * 
 */
function getUserInput() {
    switch (timer.type) {
        case 'emom':
            timerSettings.reps = IN_REPS_VAL.value;
            timerSettings.cap = calcCap(); // timerSettings.work * timerSettings.reps;
            break;
        case 'amrap':
            timerSettings.work = IN_AMRAP_MINS.value * 60;
            timerSettings.cap = calcCap(); //
            break;
        case 'time':
            timerSettings.cap = IN_TIME_CAP_MINS.value * 60;
            break;
        case 'tabata':
            break;
        case 'hiit':
            // TODO: make customizable
            break;
        default:
            console.log("unknown type ", timer.type);
            alert("Unknown workout type!");
    }
    INPUT_AREA.classList.add('w3-hide');
};

/**
 * 
 */
function calcCap() {
    return timerSettings.warmup + (timerSettings.work + timerSettings.rest) * timerSettings.reps + timerSettings.cooldown;
}

// ================================== MAIN =============================

/**
 * Set up default settings for the user selected workout type.
 */
switch (timer.type) {
    case 'emom':
        timerSettings.warmup = 10;
        timerSettings.work = 60;
        timerSettings.rest = 0;
        timerSettings.reps = 10; // Default is 10 reps => 10 mins
        timerSettings.cooldown = 0;
        timerSettings.cap = calcCap();
        console.log(timerSettings.cap);
        timer.function = timerEmom;
        IN_REPS_VAL.value = timerSettings.reps;
        IN_REPS.classList.remove('w3-hide');
        break;
    case 'amrap':
        timerSettings.warmup = 10;
        timerSettings.work = 15 * 60; // Default is 15 mins
        timerSettings.rest = 0;
        timerSettings.reps = 0;
        timerSettings.cooldown = 0;
        timerSettings.cap = calcCap(); // timerSettings.work;
        timer.function = timerAmrap;
        IN_AMRAP_MINS.value = timerSettings.work / 60;
        IN_AMRAP.classList.remove('w3-hide');
        break;
    case 'time':
        timerSettings.warmup = 10;
        timerSettings.work = 0;
        timerSettings.rest = 0;
        timerSettings.reps = 0;
        timerSettings.cap = 20 * 60; // Default is 20 mins
        timerSettings.cooldown = 0;
        timer.function = timerTime;
        IN_TIME_CAP_MINS.value = timerSettings.cap / 60;
        IN_TIME_CAP.classList.remove('w3-hide');
        break;
    case 'tabata':
        timerSettings.warmup = 10;
        timerSettings.work = 20; // Standard tabata: 20 secs work
        timerSettings.rest = 10; // Standard tabata: 10 secs rest
        timerSettings.reps = 8;  // Standard tabata: 8 reps
        timerSettings.cooldown = 0;
        timerSettings.cap = calcCap(); // (timerSettings.work + timerSettings.rest) * timerSettings.reps;
        timer.function = timerHiit;
        break;
    case 'hiit':
        timerSettings.warmup = 4 * 60;
        timerSettings.work = 4 * 60;
        timerSettings.rest = 4 * 60;
        timerSettings.reps = 4;
        timerSettings.cooldown = 4 * 60;
        timerSettings.cap = calcCap();
        timer.function = timerHiit;
        break;
    default:
        timerSettings.warmup = 0;
        timerSettings.work = 0;
        timerSettings.rest = 0;
        timerSettings.reps = 0;
        timerSettings.cooldown = 0;
        timerSettings.cap = 0;
        console.log("unknown type ", timer.type);
        alert("Unknown workout type!");
}

STARTSTOPBUTTON.addEventListener("click", toggleStartStopButton);
updateWorkoutText(timer.type);
updateProgressbar(0);
updateTimerText(0);
