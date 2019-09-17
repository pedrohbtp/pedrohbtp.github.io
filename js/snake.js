/*
Game interface from Learn Web Developement
Youtube channel : https://www.youtube.com/channel/UC8n8ftV94ZU_DJLOLtrpORA

AI code from Pedro Torres
*/
// const tf = require('@tensorflow/tfjs-node')
const cvs = document.getElementById("snake");
const ctx = cvs.getContext("2d");

// create the unit
const box = 32;

// load images

const ground = new Image();
ground.src = "img/ground.png";

const foodImg = new Image();
foodImg.src = "img/food.png";

// load audio files

let dead = new Audio();
let eat = new Audio();
let up = new Audio();
let right = new Audio();
let left = new Audio();
let down = new Audio();

dead.src = "audio/dead.mp3";
eat.src = "audio/eat.mp3";
up.src = "audio/up.mp3";
right.src = "audio/right.mp3";
left.src = "audio/left.mp3";
down.src = "audio/down.mp3";

// AI model
let model = null
// create the snake
let snake = [];

snake[0] = {
    x: 9 * box,
    y: 10 * box
};
snake[1] = {
    x: 8 * box,
    y: 9 * box
};
snake[2] = {
    x: 7 * box,
    y: 8 * box
};
// create the food

let food = {
    x: Math.floor(Math.random() * 17 + 1) * box,
    y: Math.floor(Math.random() * 15 + 3) * box
}

// board limits
let boardLimitXMax = 17
let boardLimitXMin = 1
let boardLimitYMax = 17
let boardLimitYMin = 3

// create the score var

let score = 0;

//control the snake

let d;

// adds the keyboard listener
// document.addEventListener("keydown", direction);

function direction(event) {
    let key = event.keyCode;
    if (key == 37 && d != "RIGHT") {
        // left.play();
        d = "LEFT";
    } else if (key == 38 && d != "DOWN") {
        d = "UP";
        // up.play();
    } else if (key == 39 && d != "LEFT") {
        d = "RIGHT";
        // right.play();
    } else if (key == 40 && d != "UP") {
        d = "DOWN";
        // down.play();
    }
    predictAndDraw()
    draw()
}

// cheack collision function
function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) {
            return true;
        }
    }
    return false;
}

function addSnakeSegment() {

    // adds a segment to the snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "green" : "white";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);

        ctx.strokeStyle = "red";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

}

// draw everything to the canvas

function draw() {

    ctx.drawImage(ground, 0, 0);
    // console.log(getState())
    addSnakeSegment()

    ctx.drawImage(foodImg, food.x, food.y);

    // old head position
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    // which direction
    if (d == "LEFT") {
        snakeX -= box;
    }
    if (d == "UP") {
        snakeY -= box;
    }
    if (d == "RIGHT") {
        snakeX += box;
    }
    if (d == "DOWN") {
        snakeY += box;
    }

    // if the snake eats the food
    if (snakeX == food.x && snakeY == food.y) {
        score++;
        // eat.play();
        food = {
            x: Math.floor(Math.random() * 17 + 1) * box,
            y: Math.floor(Math.random() * 15 + 3) * box
        }
        // simplify game removing tail
        snake.pop();
    } else {
        // remove the tail
        snake.pop();
    }

    // add new Head

    let newHead = {
        x: snakeX,
        y: snakeY
    }

    // game over

    if (snakeX < boardLimitXMin * box || snakeX > boardLimitXMax * box || snakeY < boardLimitYMin * box || snakeY > boardLimitYMax * box || collision(newHead, snake)) {
        clearInterval(game);
        // console.log('over')
        // dead.play();
    }

    snake.unshift(newHead);

    ctx.fillStyle = "white";
    ctx.font = "45px Changa one";
    ctx.fillText(score, 2 * box, 1.6 * box);
}

function getState() {
    // it is inverted because during training it is like this
    let snakeY = snake[0].x;
    let snakeX = snake[0].y;
    let isBoardLeft = snakeX <= (boardLimitXMin + 1) * box
    let isBoardRight = snakeX >= (boardLimitXMax - 1) * box
    let isBoardUp = snakeY <= (boardLimitYMin + 1) * box
    let isBoardDown = snakeY >= (boardLimitYMax - 1) * box

    dict_rep = {
        // it is inverted because the training was like that
        'is_food_left': snake[0].y > food.y,
        'is_food_right': snake[0].y < food.y,
        'is_food_up': snake[0].x > food.x,
        'is_food_down': snake[0].x < food.x,
        'is_moving_left': d == 'LEFT',
        'is_moving_right': d == 'RIGHT',
        'is_moving_up': d == 'UP',
        'is_moving_down': d == 'DOWN',
        // the flags that represent danger
        'is_danger_left': isBoardLeft,
        'is_danger_right': isBoardRight,
        'is_danger_up': isBoardUp,
        'is_danger_down': isBoardDown

    }
    // console.log(dict_rep)
    list_resp = []
    for (i in dict_rep) {
        // console.log(i)
        list_resp.push(dict_rep[i] == true ? 1 : 0)
    }
    return list_resp
}

async function init() {
    //loads model
    let model = await tf.loadGraphModel('snake/model.json')
    draw()

}
async function test() {

    const saveResults = await model.save('localstorage://my-model-1');
}
const MODEL_HTTP_URL = 'snake/model.json';

async function fetchModel() {
    try {
        // console.log('url: ', window.location.href + MODEL_HTTP_URL)
        let model = await tf.loadGraphModel(window.location.href + MODEL_HTTP_URL);
        // console.log('Model loaded from HTTP.');
        // console.log(model);
        return model;
    } catch (error) {
        console.error(error);
    }
}

// init()



async function predictAndDraw() {
    let state = getState()
    let a = tf.tensor2d([state], shape = [1, 12], dtype = "int32")
    // calls predict on the model
    let preResp = await model.predict(a).array()
    // let actionIndex = preResp[0].indexOf(Math.max(...preResp[0]))
    indexes = preResp[0].map((val, ind) => {return {ind, val}})
           .sort((a, b) => {return a.val > b.val ? 1 : a.val == b.val ? 0 : -1 })
           .map((obj) => obj.ind)
    actionIndex = indexes[indexes.length-1]
    // console.log(indexes)
    // console.log('preResp', preResp[0])
    // avoid choosing the opposite direction:
    if ((actionIndex == 0 && d == 'LEFT') ||  (actionIndex == 1 && d == 'RIGHT') || (actionIndex == 2&& d == 'DOWN') || (actionIndex == 3 && d == 'UP')) {
        actionIndex = indexes[indexes.length-2]
    }
    let preDir = d
    if (actionIndex == 0) {
        preDir = 'RIGHT'
    } else if (actionIndex == 1) {
        preDir = 'LEFT'
    } else if (actionIndex == 2) {
        preDir = 'UP'
    } else if (actionIndex == 3) {
        preDir = 'DOWN'
    }
    // console.log('action index: ', actionIndex)
    // console.log('direction: ', preDir)
    d = preDir
    draw()
}

let game = null

fetchModel().then(async modelResp => {
    model = modelResp
    game = setInterval(predictAndDraw, 100)
})

// call draw function every 100 ms

// let game = setInterval(draw,100);



















