/**
 * myWorkoutTimer
 *
 * Copyright (C) 2020-2021 BITJUNGLE Rune Mathisen
 * This code is licensed under a GPLv3 license 
 * See http://www.gnu.org/licenses/gpl-3.0.html 
 */

if (!navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
        console.log('Service worker has been registered for scope: ' + registration.scope);
    }).catch(error => {
        console.log('Service worker feiled! ' + error);
    });
}
