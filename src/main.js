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

// Player controls - each player gets a random key
let availableKeys = ['a', 'c', 'k', 'p', 'e', 'v', 'b', 'o', 'h', 'g'];
let playerKeys = [];
for (let i = 0; i < numPlayers; i++) {
    playerKeys.push(availableKeys.splice(k.rand(availableKeys.length), 1));
} 

// create bubbles for each player
let leftFour = playerKeys.splice(0, 4)
for (let i = 0; i < leftFour.length; i++) {
    k.add([
        k.rect(100, 100, { radius: 20 }),
        k.pos(40, 40 + i * 150),
        k.rotate(0),
        k.anchor("center"),
        k.outline(4, BLACK),
    ]);
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

// Lit sections system
const litSections = [];
const litSectionLength = 0.08; // Length of each lit section as a fraction of total track

// Create lit section objects
function createLitSection(laneIndex, startProgress) {
    const lane = lanes[laneIndex];
    const section = {
        lane: laneIndex,
        startProgress: startProgress,
        endProgress: startProgress + litSectionLength,
        state: 'fadeIn', // 'fadeIn' -> 'flashing' -> removed
        timer: 0,
        obj: null,
        flashTimer: 0
    };
    
    // Create visual representation
    updateLitSectionVisual(section);
    litSections.push(section);
    return section;
}

// Update the visual representation of a lit section
function updateLitSectionVisual(section) {
    // Remove old visual if it exists
    if (section.obj) {
        section.obj.destroy();
    }
    
    const lane = lanes[section.lane];
    const numSegments = 20; // Number of segments to approximate the curved section
    const segmentLength = litSectionLength / numSegments;
    
    // Create multiple small rectangles to follow the track curve
    for (let i = 0; i < numSegments; i++) {
        const progress = section.startProgress + i * segmentLength;
        const pos = getTrackPosition(lane, progress);
        
        let color, opacity;
        
        if (section.state === 'fadeIn') {
            // Pink color that fades in over 2 seconds
            color = [255, 192, 203];
            opacity = Math.min(section.timer / 2.0, 1.0); // Fade in over 2 seconds
        } else if (section.state === 'flashing') {
            // Flash between red and orange
            const flashSpeed = 8; // Flashes per second
            const isRed = Math.floor(section.flashTimer * flashSpeed) % 2 === 0;
            color = isRed ? [255, 0, 0] : [255, 165, 0]; // Red or Orange
            opacity = 1.0;
        }
        
        k.add([
            k.rect(8, 8),
            k.pos(pos.x, pos.y),
            k.anchor("center"),
            k.color(...color),
            k.opacity(opacity),
            k.z(5), // Render lit sections above track but below players
            `litSection_${section.lane}_${Math.floor(section.startProgress * 1000)}`
        ]);
    }
}

// Update opacity of existing lit section (more efficient for fade-in)
function updateLitSectionOpacity(section) {
    const tag = `litSection_${section.lane}_${Math.floor(section.startProgress * 1000)}`;
    const segments = k.get(tag);
    
    if (section.state === 'fadeIn') {
        const opacity = Math.min(section.timer / 2.0, 1.0);
        segments.forEach(segment => {
            segment.opacity = opacity;
        });
    }
}

// Remove lit section visual
function removeLitSectionVisual(section) {
    const tag = `litSection_${section.lane}_${Math.floor(section.startProgress * 1000)}`;
    k.destroyAll(tag);
}

// Spawn new lit sections randomly
function spawnLitSection() {
    const randomLane = Math.floor(Math.random() * numPlayers);
    const player = players[randomLane];
    
    // Spawn lit section in front of the player (0.1 to 0.4 ahead for more variety)
    const distanceAhead = 0.1 + Math.random() * 0.3;
    let spawnProgress = player.progress + distanceAhead;
    
    // Handle wrap-around
    if (spawnProgress >= 1) {
        spawnProgress -= 1;
    }
    
    createLitSection(randomLane, spawnProgress);
}

// Start spawning lit sections
let spawnTimer = 0;
const spawnInterval = 0.8; // Spawn every 0.8 seconds (more frequent)

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
        k.z(10), // Render players on top of track elements
        "player"
    ]);
    
    players.push({
        obj: player,
        lane: i,
        progress: 0, // Progress around the track (0 to 1)
        laps: 0,
        stunned: false,
        stunTimer: 0
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
        
        // Check if player is stunned
        if (player.stunned) {
            return; // Can't move while stunned
        }
        
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
        
        // Check collision with red lit sections
        checkLitSectionCollision(player);
    });
}

// Check if player collides with any red lit sections
function checkLitSectionCollision(player) {
    for (const section of litSections) {
        if (section.lane === player.lane && section.state === 'flashing') {
            // Check if player is within the lit section
            const playerProgress = player.progress;
            let sectionStart = section.startProgress;
            let sectionEnd = section.endProgress;
            
            // Handle wrap-around at the track boundary
            if (sectionEnd > 1) {
                if (playerProgress >= sectionStart || playerProgress <= (sectionEnd - 1)) {
                    stunPlayer(player);
                    break;
                }
            } else {
                if (playerProgress >= sectionStart && playerProgress <= sectionEnd) {
                    stunPlayer(player);
                    break;
                }
            }
        }
    }
}

// Stun a player
function stunPlayer(player) {
    player.stunned = true;
    player.stunTimer = 1.0; // 1 second stun
    
    // Visual feedback - make player flash red
    player.obj.color = k.rgb(255, 100, 100);
}

// Update loop
k.onUpdate(() => {
    const dt = k.dt();
    
    // Update spawn timer
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
        spawnLitSection();
        spawnTimer = 0;
    }
    
    // Update lit sections
    for (let i = litSections.length - 1; i >= 0; i--) {
        const section = litSections[i];
        section.timer += dt;
        
        if (section.state === 'fadeIn') {
            // Update opacity during fade-in (more efficient than recreating)
            updateLitSectionOpacity(section);
            
            // After 2 seconds, change to flashing state
            if (section.timer >= 2.0) {
                section.state = 'flashing';
                section.timer = 0;
                section.flashTimer = 0;
                // Only recreate visual when transitioning to flashing
                updateLitSectionVisual(section);
            }
        } else if (section.state === 'flashing') {
            section.flashTimer += dt;
            
            // Update visual for flashing effect
            updateLitSectionVisual(section);
            
            // After 2 seconds of flashing, remove the section
            if (section.timer >= 2.0) {
                removeLitSectionVisual(section);
                litSections.splice(i, 1);
            }
        }
    }
    
    // Update stunned players
    for (const player of players) {
        if (player.stunned) {
            player.stunTimer -= dt;
            if (player.stunTimer <= 0) {
                player.stunned = false;
                player.obj.color = k.rgb(255, 255, 255); // Reset to normal color
            }
        }
    }
});