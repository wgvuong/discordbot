const {Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { token } = require('./config.json');
const { TicTacToe } = require('./databaseObjects.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log('Ready!');
})

client.on('messageCreate', (message) => {
    if(message.author.id === client.user.id) return;

    if(message.content === "ping") {
        message.reply("pong");
    }
})


/* Tic-Tac-Toe */
let EMPTY = Symbol("empty");
let PLAYER = Symbol("player");
let BOT = Symbol("bot");

let tictactoe_state

function makeGrid() {
    components = []

    for(let row = 0; row < 3; row++) {
        const actionRow = new ActionRowBuilder()
        
        for(let col = 0; col < 3; col++) {
            switch(tictactoe_state[row][col]) {
                case EMPTY:
                    actionRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId('tictactoe_' + row + '_' + col)
                            .setLabel(' ')
                            .setStyle('Secondary')
                    );
                    break;
                case PLAYER:
                    actionRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId('tictactoe_' + row + '_' + col)
                            .setLabel('X')
                            .setStyle('Primary')
                    );
                    break;
                case BOT:
                    actionRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId('tictactoe_' + row + '_' + col)
                            .setLabel('O')
                            .setStyle('Danger')
                    );
                    break;
            }
        }

        components.push(actionRow)
    }
    return components
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function isGameOver() {
    for(let i = 0; i < 3; i++) {
        /* Horizontal Cases */
        if((tictactoe_state[i][0] === tictactoe_state[i][1]) && 
            (tictactoe_state[i][1] == tictactoe_state[i][2]) && 
            (tictactoe_state[i][2] != EMPTY)) {
            return true;
        }
        /* Vertical Cases */
        if((tictactoe_state[0][i] == tictactoe_state[1][i]) &&
            (tictactoe_state[1][i] == tictactoe_state[2][i]) &&
            (tictactoe_state[2][i] != EMPTY)) {
                return true;
        }
        /* Diagonal Cases */
        if((tictactoe_state[1][1] != EMPTY) &&
        (((tictactoe_state[0][0] == tictactoe_state[1][1]) && (tictactoe_state[1][1] == tictactoe_state[2][2])) ||
        ((tictactoe_state[2][0] == tictactoe_state[1][1]) && (tictactoe_state[1][1] == tictactoe_state[0][2])))) {
            return true;
        }
    }
    return false;
}
function isDraw() {
    for(let row = 0; row < 3; row++) {
        for(let col = 0; col < 3; col++) {
            if(tictactoe_state[row][col] == EMPTY) {
                return false;
            }
        }
    }
    return true;
}

client.on('interactionCreate', async interaction => {
    if(!interaction.isButton()) return;
    if(!interaction.customId.startsWith('tictactoe')) return;

    if(isGameOver()) {
        interaction.update({
            components: makeGrid()
        })
        return;
    }

    let parsedFields = interaction.customId.split("_")
    let row = parsedFields[1]
    let col = parsedFields[2]

    if(tictactoe_state[row][col] != EMPTY) {
        interaction.update({
            content: "You can't select that square!",
            components: makeGrid()
        })
        return;
    }

    tictactoe_state[row][col] = PLAYER;

    if(isGameOver()) {
        let user = await TicTacToe.findOne({
            where: {
                user_id: interaction.user.id
            }
        });
        if(!user) {
            user = await TicTacToe.create({ user_id: interaction.user.id });
        }

        await user.increment('score');

        interaction.update({
            content: "You won the game of tic-tac-toe! You have now won " + (user.get('score') + 1) + " times(s).",
            components: []
        })
        return;
    }
    if(isDraw()) {
        interaction.update({
            content: "The game resulted in a draw!",
            components: []
        })
        return;
    }
    
    /* Bot Functionality */
    let botRow
    let botCol
    do {
        botRow = getRandomInt(3)
        botCol = getRandomInt(3)
    } while(tictactoe_state[botRow][botCol] != EMPTY);

    tictactoe_state[botRow][botCol] = BOT;

    if(isGameOver()) {
        interaction.update({
            content: "You lost the game of tic-tac-toe!",
            components: makeGrid()
        })
        return;
    }
    if(isDraw()) {
        interaction.update({
            content: "The game resulted in a draw!",
            components: []
        })
        return;
    }

    interaction.update({
        components: makeGrid()
    })
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;

    const { commandName } = interaction;

    if(commandName === 'tictactoe') {
        tictactoe_state = [
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY]
        ]

        await interaction.reply({ content: 'Playing a game of tic-tac-toe!', components: makeGrid() });
    }
})

client.login(token);