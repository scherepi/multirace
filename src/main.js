import kaplay from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("bean", "sprites/bean.png");

const numPlayers = 8;

const laneWidth = 400 / numPlayers; 

k.setBackground(0, 0, 0);

let laneAssignments = [];

for (let i = 0; i < numPlayers; i++){
    const lane = k.add([
        k.rect(1900, laneWidth),
        k.pos(0, 100 + i * laneWidth),
        k.outline(4),
        k.area()
    ]);
    const player = k.add([
        k.pos(25, 125 + i * laneWidth),
        k.color(rand(rgb(255, 255, 255))),
        k.circle(20)
    ]);
}

k.add([k.pos(120, 80), k.sprite("bean")]);

const possibleKeys = ['A', 'C', 'K', 'L', 'E', 'P', 'R', 'V', 'B', '4', 'X'];

const keyAssignments = [];