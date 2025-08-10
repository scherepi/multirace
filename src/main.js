import kaplay from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

let started = false;
let inputEnabled = false;
export function enableInput() { inputEnabled = true; }
export function disableInput() { inputEnabled = false; }
export function initGame() {
  if (started) return;
  started = true;
  const k = kaplay();

  k.loadRoot("./"); // A good idea for Itch.io publishing later
  k.loadSprite("grass", "sprites/grass.png");
  k.loadFont("VT323", 'fonts/VT323-Regular.ttf');

  // Load individual character sprites
  for (let i = 1; i <= 8; i++) {
      k.loadSprite(`character${i}`, `sprites/${i}.png`);
  }

  const lapsToWin = 2;
  let gameOver = false;
  let winnerIndex = null;

  // Obstacle configuration
  const obstacleSpawnInterval = 0.4; // Time in seconds between obstacle spawns
  const obstacleMinDistance = 0.1; // Minimum distance ahead of player to spawn obstacle (0-1)
  const obstacleMaxDistance = 0.4; // Maximum distance ahead of player to spawn obstacle (0-1)

  // Player knockback configuration
  const knockbackBaseDistance = 0.08; // Base distance to send player back (0-1 track progress)
  const knockbackVariation = 0.02; // Additional random variation (0-1 track progress)
  const knockbackAnimationTime = 0.3; // Time in seconds for smooth knockback animation

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

  // Draw the track background first with repeating grass texture
  const grassTileSize = 64; // Adjust this based on your grass.png size
  const numTilesX = Math.ceil(k.width() / grassTileSize);
  const numTilesY = Math.ceil(k.height() / grassTileSize);

  for (let x = 0; x < numTilesX; x++) {
      for (let y = 0; y < numTilesY; y++) {
          k.add([
              k.sprite("grass"),
              k.pos(x * grassTileSize, y * grassTileSize),
              k.z(-10) // Behind everything
          ]);
      }
  }

// Player colors
const playerColors = [
    "#d77bba", // Player 1 - Pink
    "#5fcde4", // Player 2 - Light Blue
    "#99e550", // Player 3 - Green
    "#d95763", // Player 4 - Red
    "#a966c3", // Player 5 - Purple
    "#e1da49", // Player 6 - Yellow
    "#df7126", // Player 7 - Orange
    "#9badb7"  // Player 8 - Gray
];

// Color name mappings for victory screen
const playerColorNames = [
    "pink",     // Player 1
    "blue",     // Player 2
    "green",    // Player 3
    "red",      // Player 4
    "purple",   // Player 5
    "yellow",   // Player 6
    "orange",   // Player 7
    "gray"      // Player 8
];

  // create bubbles for each player

  let leftFour = playerKeys.slice(0, 4);
  for (let i = 0; i < leftFour.length; i++) {
      k.add([
          k.rect(100, 100, { radius: 20 }),
          k.pos(100, 100 + i * 150),
          k.rotate(0),
          k.anchor("center"),
          k.outline(4, k.BLACK),
      ])
    // Player color inner border
    k.add([
        k.rect(88, 88, { radius: 20 }),
        k.pos(100, 100 + i * 150),
        k.rotate(0),
        k.anchor("center"),
        k.outline(5, k.Color.fromHex(playerColors[i])),
    ])
      // keycode label
      k.add([
          k.pos(100, 100 + i * 150),
          k.text(leftFour[i], {
              size: 45,
              font: "VT323"
          }),
          k.color(0, 0, 0),
          k.anchor("center")
      ])
      
      // Lap counter - overlapping bottom left corner
      k.add([
          k.rect(35, 25, { radius: 5 }),
          k.pos(100 - 50 + 17.5, 100 + i * 150 + 50 - 12.5), // Bottom left corner overlap
          k.anchor("center"),
          k.color(255, 255, 255),
          k.outline(2, k.BLACK),
          k.z(20)
      ]);
      
      k.add([
          k.pos(100 - 50 + 17.5, 100 + i * 150 + 50 - 12.5),
          k.text("0/2", {
              size: 16,
              font: "VT323"
          }),
          k.color(0, 0, 0),
          k.anchor("center"),
          k.z(21),
          `lapCounter${i}`
      ]);
      // position label
  }
  let rightFour = playerKeys.slice(4);
  for (let i = 0; i < rightFour.length; i++) {
      k.add([
          k.rect(100, 100, {radius: 20}),
          k.pos(k.width() - 100, 100 + i * 150),
          k.rotate(0),
          k.anchor("center"),
          k.outline(4, k.BLACK),
      ]);
    // Player color inner border
    k.add([
        k.rect(88, 88, { radius: 20 }),
        k.pos(k.width() - 100, 100 + i * 150),
        k.rotate(0),
        k.anchor("center"),
        k.outline(5, k.Color.fromHex(playerColors[i + 4])),
    ]);
      k.add([
          k.pos(k.width() - 100, 100 + i * 150),
          k.text(rightFour[i], {
              size: 45,
              font: "VT323"
          }),
          k.color(0, 0, 0),
          k.anchor("center")
      ]);
      
      // Lap counter - overlapping bottom left corner
      k.add([
          k.rect(35, 25, { radius: 5 }),
          k.pos(k.width() - 100 - 50 + 17.5, 100 + i * 150 + 50 - 12.5), // Bottom left corner overlap
          k.anchor("center"),
          k.color(255, 255, 255),
          k.outline(2, k.BLACK),
          k.z(20)
      ]);
      
      k.add([
          k.pos(k.width() - 100 - 50 + 17.5, 100 + i * 150 + 50 - 12.5),
          k.text("0/2", {
              size: 16,
              font: "VT323"
          }),
          k.color(0, 0, 0),
          k.anchor("center"),
          k.z(21),
          `lapCounter${i + 4}`
      ]);
  }

  console.log(playerKeys);

  // Create racing track lanes using rounded rectangles
  const lanes = [];
  const straightLength = trackWidth;
  const turnRadius = trackHeight / 2;

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
      k.color(k.Color.fromHex("#6abe30"))
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
          k.color(k.Color.fromHex("#6abe30"))
      ]);
  })()

  // Add finish line - vertical line at the start/finish position (moved slightly right)
  const finishLineX = trackCenterX - straightLength / 2 + 5; // Moved 5 pixels to the right
  const finishLineTopY = trackCenterY - (turnRadius + (numPlayers - 1) * laneSpacing + laneSpacing);
  const finishLineBottomY = trackCenterY - turnRadius;
  const finishLineHeight = finishLineBottomY - finishLineTopY;
  
  // Simple thin black finish line
  k.add([
      k.rect(2, finishLineHeight),
      k.pos(finishLineX, finishLineTopY + finishLineHeight / 2),
      k.anchor("center"),
      k.color(0, 0, 0),
      k.z(5), // Below players but above track
      "finishLine"
  ]);

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
      
      // Spawn lit section in front of the player using config variables
      const distanceAhead = obstacleMinDistance + Math.random() * (obstacleMaxDistance - obstacleMinDistance);
      let spawnProgress = player.progress + distanceAhead;
      
      // Handle wrap-around
      if (spawnProgress >= 1) {
          spawnProgress -= 1;
      }
      
      createLitSection(randomLane, spawnProgress);
  }

  // Start spawning lit sections
  let spawnTimer = 0;
  const spawnInterval = obstacleSpawnInterval; // Use config variable for spawn frequency

  // Create players
  const players = [];
  for (let i = 0; i < numPlayers; i++) {
      const lane = lanes[i];
      // Start at the beginning of the top straight
      const startX = trackCenterX - lane.straightLength / 2;
      const startY = trackCenterY - lane.radius;
      
      const player = k.add([
          k.sprite(`character${i + 1}`), // Use character1.png through character8.png
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
          knockedBack: false,
          knockbackTimer: 0,
          knockbackStartProgress: 0,
          knockbackEndProgress: 0,
          stunnedByObstacle: null, // Reference to the obstacle that's stunning this player
          waitingForKnockback: false // Flag to indicate player should be knocked back when obstacle disappears
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
          if (gameOver || !inputEnabled) return;
          const player = players[i];
          
          // Check if player is being knocked back or stunned by obstacle
          if (player.knockedBack || player.stunnedByObstacle) {
              return; // Can't move while being knocked back or stunned
          }
          
          const lane = lanes[player.lane];
          
          // Move player forward by a small amount
          player.progress += 0.02;
          
          // Check for lap completion
          if (player.progress >= 1) {
              player.progress = 0;
              player.laps++;
              
              // Update lap counter display
              const lapCounterObj = k.get(`lapCounter${i}`)[0];
              if (lapCounterObj) {
                  lapCounterObj.text = `${player.laps}/2`;
              }
              
              if (!gameOver && player.laps >= lapsToWin) {
                  endGame(i);
              }
          }
          
          // Calculate new position on racetrack
          const position = getTrackPosition(lane, player.progress);
          player.obj.pos = k.vec2(position.x, position.y);
          player.obj.angle = position.angle * (180 / Math.PI);
          
          // Check collision with red lit sections
          checkLitSectionCollision(player);
      });
  }

  function endGame(winnerIdx) {
      if (gameOver) return;
      gameOver = true;
      winnerIndex = winnerIdx;

      // Create game over overlay similar to title screen
      const overlayDiv = document.createElement('div');
      overlayDiv.id = 'gameOverScreen';
      overlayDiv.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: black;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 24px;
          font-family: monospace;
          z-index: 1000;
      `;

      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = 'text-align: center;';
      
      const winnerColorName = playerColorNames[winnerIdx];
      
      contentDiv.innerHTML = `
          <h1 style="font-size: 48px; margin: 20px 0; text-transform: uppercase;">${winnerColorName} wins!</h1>
          <p style="font-size: 24px; margin: 20px 0;">Game Over</p>
          <button id="playAgainBtn" style="
              font-family: monospace;
              font-size: 18px;
              padding: 12px 24px;
              background-color: transparent;
              color: white;
              border: 2px solid white;
              cursor: pointer;
              margin-top: 20px;
              text-transform: uppercase;
          ">Play Again</button>
      `;

      overlayDiv.appendChild(contentDiv);
      document.body.appendChild(overlayDiv);

      // Add hover effect to button
      const playAgainBtn = document.getElementById('playAgainBtn');
      playAgainBtn.addEventListener('mouseenter', () => {
          playAgainBtn.style.backgroundColor = 'white';
          playAgainBtn.style.color = 'black';
      });
      playAgainBtn.addEventListener('mouseleave', () => {
          playAgainBtn.style.backgroundColor = 'transparent';
          playAgainBtn.style.color = 'white';
      });

      // Handle play again click
      playAgainBtn.addEventListener('click', () => {
          location.reload(); // Simple page reload to restart the game
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
                      stunPlayerOnObstacle(player, section);
                      break;
                  }
              } else {
                  if (playerProgress >= sectionStart && playerProgress <= sectionEnd) {
                      stunPlayerOnObstacle(player, section);
                      break;
                  }
              }
          }
      }
  }

  // Check all players for collisions with flashing obstacles (called during update loop)
  function checkAllPlayersForCollisions() {
      for (const player of players) {
          // Skip players who are already being knocked back
          if (!player.knockedBack && !player.stunnedByObstacle) {
              checkLitSectionCollision(player);
          }
          
          // Check if stunned players are still on their obstacle
          if (player.stunnedByObstacle) {
              checkIfPlayerStillOnObstacle(player);
          }
      }
  }

  // Check if a stunned player is still on their obstacle
  function checkIfPlayerStillOnObstacle(player) {
      const section = player.stunnedByObstacle;
      if (!section || section.state !== 'flashing') {
          // Obstacle is gone or no longer dangerous
          player.stunnedByObstacle = null;
          player.waitingForKnockback = true;
          return;
      }
      
      const playerProgress = player.progress;
      let sectionStart = section.startProgress;
      let sectionEnd = section.endProgress;
      
      let stillOnObstacle = false;
      
      // Handle wrap-around at the track boundary
      if (sectionEnd > 1) {
          if (playerProgress >= sectionStart || playerProgress <= (sectionEnd - 1)) {
              stillOnObstacle = true;
          }
      } else {
          if (playerProgress >= sectionStart && playerProgress <= sectionEnd) {
              stillOnObstacle = true;
          }
      }
      
      if (!stillOnObstacle) {
          // Player is no longer on the obstacle, unstun them
          player.stunnedByObstacle = null;
          player.waitingForKnockback = true;
      }
  }

  // Stun a player when they're on an obstacle
  function stunPlayerOnObstacle(player, obstacleSection) {
      // Don't stun if already stunned or being knocked back
      if (player.stunnedByObstacle || player.knockedBack) {
          return;
      }
      
      player.stunnedByObstacle = obstacleSection;
      player.waitingForKnockback = false;
      
      // Visual feedback - subtle red tint while stunned
      player.obj.color = k.rgb(255, 240, 240);
  }

  // Knock back a player when they hit an obstacle
  function knockBackPlayer(player, obstacleSection) {
      // Don't knock back if already being knocked back
      if (player.knockedBack) {
          return;
      }
      
      player.knockedBack = true;
      player.knockbackTimer = 0;
      player.waitingForKnockback = false;
      
      // Calculate knockback distance (base + random variation)
      const knockbackDistance = knockbackBaseDistance + Math.random() * knockbackVariation;
      
      // Set knockback to start of obstacle minus the knockback distance
      let targetProgress = obstacleSection.startProgress - knockbackDistance;
      
      // Handle wrap-around - keep it simple, just clamp to 0
      if (targetProgress < 0) {
          targetProgress = 0;
      }
      
      player.knockbackStartProgress = player.progress;
      player.knockbackEndProgress = targetProgress;
      
      // Subtle red tint - much less intense than before
      player.obj.color = k.rgb(255, 240, 240);
  }

  // Update loop
  k.onUpdate(() => {
      if (gameOver) return;
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
                  // Check if any players are already on this obstacle when it becomes active
                  checkAllPlayersForCollisions();
              }
          } else if (section.state === 'flashing') {
              section.flashTimer += dt;
              
              // Update visual for flashing effect
              updateLitSectionVisual(section);
              
              // After 2 seconds of flashing, remove the section
              if (section.timer >= 2.0) {
                  // Before removing, check if any players were stunned by this obstacle
                  for (const player of players) {
                      if (player.stunnedByObstacle === section) {
                          player.stunnedByObstacle = null;
                          player.waitingForKnockback = true;
                      }
                  }
                  
                  removeLitSectionVisual(section);
                  litSections.splice(i, 1);
              }
          }
      }
      
      // Check for collisions every frame (catches cases where obstacles spawn on players)
      checkAllPlayersForCollisions();
      
      // Update knocked back players
      for (const player of players) {
          // Handle players waiting for knockback after being stunned
          if (player.waitingForKnockback && !player.knockedBack && !player.stunnedByObstacle) {
              // Create a dummy obstacle section for knockback calculation
              const dummyObstacle = {
                  startProgress: player.progress + 0.05 // Knockback from slightly ahead of current position
              };
              knockBackPlayer(player, dummyObstacle);
          }
          
          if (player.knockedBack) {
              player.knockbackTimer += dt;
              
              // Calculate smooth interpolation progress (0 to 1)
              const animationProgress = Math.min(player.knockbackTimer / knockbackAnimationTime, 1.0);
              
              // Use easing function for smoother animation (ease-out)
              const easedProgress = 1 - Math.pow(1 - animationProgress, 3);
              
              // Simple linear interpolation - no wrap-around complexity
              const currentProgress = player.knockbackStartProgress + 
                  (player.knockbackEndProgress - player.knockbackStartProgress) * easedProgress;
              
              player.progress = currentProgress;
              
              // Update player position
              const lane = lanes[player.lane];
              const position = getTrackPosition(lane, player.progress);
              player.obj.pos = k.vec2(position.x, position.y);
              player.obj.angle = position.angle * (180 / Math.PI);
              
              // End knockback animation
              if (animationProgress >= 1.0) {
                  player.knockedBack = false;
                  player.obj.color = k.rgb(255, 255, 255); // Reset to normal color
              }
          }
          
          // Update visual state for stunned players
          if (player.stunnedByObstacle && !player.knockedBack) {
              // Keep the red tint while stunned
              player.obj.color = k.rgb(255, 240, 240);
          }
      }
  });
}
