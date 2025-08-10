import kaplay from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("bean", "sprites/bean.png");

const numPlayers = 8;

const laneWidth = 400 / numPlayers; 

for (let i = 0; i < numPlayers; i++){
    const lane = k.add([
        k.rect(1900, laneWidth),
        k.pos(0, 200 + i * laneWidth),
        k.outline(4),
        k.area()
    ]);
}

k.add([k.pos(120, 80), k.sprite("bean")]);

k.onClick(() => k.addKaboom(k.mousePos()));