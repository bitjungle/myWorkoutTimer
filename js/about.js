/**
 * myWorkoutTimer
 *
 * Copyright (C) 2020-2021 BITJUNGLE Rune Mathisen
 * This code is licensed under a GPLv3 license 
 * See http://www.gnu.org/licenses/gpl-3.0.html 
 */

let params = (new URL(document.location)).searchParams;
let workoutType = params.get("type") === null ? 'about' : params.get("type");
if (workoutType != 'about') {
    document.querySelector('#' + workoutType).classList.add('w3-theme-l4');
    document.querySelector('#' + workoutType + '_nav').classList.remove('w3-hide');
    document.querySelector('#backlink').classList.add('w3-hide');
}
