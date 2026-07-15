const nodejsWordBank = require("random-words");

//Generate 1 word of length 5 char 
let currentWord = nodejsWordBank.generate({ exactly: 1, minLength: 5, maxLength: 5 })[0];
let leaderboard = [];
let timer = 0;

function resetWord() {
    currentWord = nodejsWordBank.generate({ exactly: 1, minLength: 5, maxLength: 5 })[0];
}

function newRound(io){
    resetWord();
    timer = 30;

    io.emit("newRound");
    io.emit("gameState", { leaderboard, timer });    
    const interval = setInterval(() => { //Every 1000 miliseconds do everything in brackets
        timer--;
        console.log(timer)
        io.emit("gameState",{leaderboard, timer})

        if(timer <= 0){
            clearInterval(interval);
            newRound(io)
        }
    },1000);
}

function checkGuess(guess, player, io){
    if(guess === currentWord){
        player.score += 100;
        leaderboard.push(player);
        io.emit("gameState",{leaderboard, timer})

        setTimeout(() => newRound(io), 30000)
    }
}
module.exports = { newRound, checkGuess };