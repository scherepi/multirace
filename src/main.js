import kaplay from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("bean", "sprites/bean.png");

const numPlayers = 8;
const trackCenterX = k.width() / 2;
const trackCenterY = k.height() / 2;
const trackWidth = 300;
const trackHeight = 200;
const laneSpacing = 15;

// Player controls - each player gets a key
let availableKeys = ['A', 'C', 'K', 'P', 'E', 'V', 'B', 'O', 'H', 'G'];
let playerKeys = [];
for (let i = 0; i < numPlayers; i++) {
    playerKeys.push(availableKeys.splice(k.rand(availableKeys.length), 1));
} 

console.log(playerKeys);

// Create racing track lanes using rounded rectangles
const lanes = [];
const straightLength = trackWidth;
const turnRadius = trackHeight / 2;

// Draw the track background first (green)
k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(0, 100, 0)
]);

// Create track using rounded rectangles - draw one big white track
const outerTrackWidth = straightLength + 2 * (turnRadius + (numPlayers - 1) * laneSpacing + laneSpacing);
const outerTrackHeight = 2 * (turnRadius + (numPlayers - 1) * laneSpacing + laneSpacing);

// Outer black border
k.add([
    k.rect(outerTrackWidth + 4, outerTrackHeight + 4, { radius: turnRadius + (numPlayers - 1) * laneSpacing + laneSpacing }),
    k.pos(trackCenterX, trackCenterY),
    k.anchor("center"),
    k.color(0, 0, 0)
]);

// White track surface
k.add([
    k.rect(outerTrackWidth, outerTrackHeight, { radius: turnRadius + (numPlayers - 1) * laneSpacing + laneSpacing }),
    k.pos(trackCenterX, trackCenterY),
    k.anchor("center"),
    k.color(255, 255, 255)
]);

// Cut out the inner area to create the track shape
const innerTrackWidth = straightLength + 2 * turnRadius;
const innerTrackHeight = 2 * turnRadius;

// Inner black border
k.add([
    k.rect(innerTrackWidth + 4, innerTrackHeight + 4, { radius: turnRadius }),
    k.pos(trackCenterX, trackCenterY),
    k.anchor("center"),
    k.color(0, 0, 0)
]);

// Inner green area
k.add([
    k.rect(innerTrackWidth, innerTrackHeight, { radius: turnRadius }),
    k.pos(trackCenterX, trackCenterY),
    k.anchor("center"),
    k.color(0, 100, 0)
]);


// Draw lane dividers (black lines only, no white fill)
for (let i = numPlayers-1; i >= 0; i--) {

    const laneOffset = i * laneSpacing;
    const dividerTrackWidth = straightLength + 2 * (turnRadius + laneOffset);
    const dividerTrackHeight = 2 * (turnRadius + laneOffset);
    
    // Just a thin black line - no white fill to cover it up
    k.add([
        k.rect(dividerTrackWidth + 2, dividerTrackHeight + 2, { radius: turnRadius + laneOffset }),
        k.pos(trackCenterX, trackCenterY),
        k.anchor("center"),
        k.color(0, 0, 0)
    ]);
    
    k.add([
        k.rect(dividerTrackWidth - 2, dividerTrackHeight - 2, { radius: turnRadius + laneOffset }),
        k.pos(trackCenterX, trackCenterY),
        k.anchor("center"),
        k.color(255, 255, 255)
    ]);
}

(() => {
    const laneOffset = 0;
    const dividerTrackWidth = straightLength + 2 * (turnRadius + laneOffset);
    const dividerTrackHeight = 2 * (turnRadius + laneOffset);

    // green bit in the middle
    k.add([
        k.rect(dividerTrackWidth + 2, dividerTrackHeight + 2, { radius: turnRadius + laneOffset }),
        k.pos(trackCenterX, trackCenterY),
        k.anchor("center"),
        k.color(0, 0, 0)
    ]);

    k.add([
        k.rect(dividerTrackWidth - 2, dividerTrackHeight - 2, { radius: turnRadius + laneOffset }),
        k.pos(trackCenterX, trackCenterY),
        k.anchor("center"),
        k.color(0, 100, 0)
    ]);
})()

// Create lane data for player movement
for (let i = 0; i < numPlayers; i++) {
    const laneOffset = i * laneSpacing;
    const radius = turnRadius + laneOffset + laneSpacing/2;
    
    lanes.push({
        radius: radius,
        straightLength: straightLength,
        leftCenterX: trackCenterX - straightLength / 2,
        rightCenterX: trackCenterX + straightLength / 2,
        centerY: trackCenterY
    });
}

// Create players
const players = [];
for (let i = 0; i < numPlayers; i++) {
    const lane = lanes[i];
    // Start at the beginning of the top straight
    const startX = trackCenterX - lane.straightLength / 2;
    const startY = trackCenterY - lane.radius;
    
    const player = k.add([
        k.sprite("bean"),
        k.pos(startX, startY),
        k.scale(0.5),
        k.anchor("center"),
        k.area(),
        "player"
    ]);
    
    players.push({
        obj: player,
        lane: i,
        progress: 0, // Progress around the track (0 to 1)
        laps: 0
    });
}

// Function to calculate position on racetrack based on progress
function getTrackPosition(lane, progress) {
    const totalTrackLength = 2 * lane.straightLength + 2 * Math.PI * lane.radius;
    const topStraightLength = lane.straightLength;
    const rightTurnLength = Math.PI * lane.radius;
    const bottomStraightLength = lane.straightLength;
    const leftTurnLength = Math.PI * lane.radius;
    
    const currentDistance = progress * totalTrackLength;
    
    let x, y, angle;
    
    if (currentDistance <= topStraightLength) {
        // Top straight (moving right)
        const straightProgress = currentDistance / topStraightLength;
        x = trackCenterX - lane.straightLength/2 + straightProgress * lane.straightLength;
        y = trackCenterY - lane.radius;
        angle = 0; // facing right
    } else if (currentDistance <= topStraightLength + rightTurnLength) {
        // Right turn
        const turnProgress = (currentDistance - topStraightLength) / rightTurnLength;
        const turnAngle = -Math.PI/2 + turnProgress * Math.PI; // -90° to +90°
        x = lane.rightCenterX + Math.cos(turnAngle) * lane.radius;
        y = lane.centerY + Math.sin(turnAngle) * lane.radius;
        angle = turnAngle + Math.PI/2; // perpendicular to radius
    } else if (currentDistance <= topStraightLength + rightTurnLength + bottomStraightLength) {
        // Bottom straight (moving left)
        const straightProgress = (currentDistance - topStraightLength - rightTurnLength) / bottomStraightLength;
        x = trackCenterX + lane.straightLength/2 - straightProgress * lane.straightLength;
        y = trackCenterY + lane.radius;
        angle = Math.PI; // facing left
    } else {
        // Left turn
        const turnProgress = (currentDistance - topStraightLength - rightTurnLength - bottomStraightLength) / leftTurnLength;
        const turnAngle = Math.PI/2 + turnProgress * Math.PI; // 90° to 270°
        x = lane.leftCenterX + Math.cos(turnAngle) * lane.radius;
        y = lane.centerY + Math.sin(turnAngle) * lane.radius;
        angle = turnAngle + Math.PI/2; // perpendicular to radius
    }
    
    return { x, y, angle };
}

// Handle keyboard input for each player
for (let i = 0; i < numPlayers; i++) {
    k.onKeyPress(playerKeys[i], () => {
        const player = players[i];
        const lane = lanes[player.lane];
        
        // Move player forward by a small amount
        player.progress += 0.02;
        
        // Check for lap completion
        if (player.progress >= 1) {
            player.progress = 0;
            player.laps++;
        }
        
        // Calculate new position on racetrack
        const position = getTrackPosition(lane, player.progress);
        player.obj.pos = k.vec2(position.x, position.y);
        player.obj.angle = position.angle * (180 / Math.PI);
    });
}