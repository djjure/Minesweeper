const board = document.getElementById('board');
const width = 10;
var mineLocations = [];
var flags = 0;
var gameover = false;

// Touch event variables for flagging (long press)
var longPressTimer;
var touchStartX = 0;
var touchStartY = 0;
var longPressThreshold = 500; // milliseconds for a long press
var moveThreshold = 10; // pixels of movement to cancel long press

// Create Board
function createBoard() {
    board.innerHTML = ''; // Clear existing cells if called multiple times (e.g., for reset)
    mineLocations = [];
    for (var i = 0; i < width; i++) {
        mineLocations[i] = [];
        for (var j = 0; j < width; j++) {
            mineLocations[i][j] = false; // Initialize all cells as non-mine
        }
    }

    // Generate random mine locations
    var mineCount = 15;
    while (mineCount > 0) {
        var x = Math.floor(Math.random() * width);
        var y = Math.floor(Math.random() * width);
        if (!mineLocations[x][y]) {
            mineLocations[x][y] = true;
            mineCount--;
        }
    }

    for (var i = 0; i < width; i++) {
        for (var j = 0; j < width; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-x', i);
            cell.setAttribute('data-y', j);
            board.appendChild(cell);

            // --- Touch Event Handlers ---
            cell.addEventListener('touchstart', function(e) {
                if (gameover) return;
                e.preventDefault(); // Prevent default browser actions (zoom, scroll, context menu)
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                var currentCell = this; // Capture 'this' (the cell)
                longPressTimer = setTimeout(function() {
                    flagCell(currentCell);
                    longPressTimer = null; // Clear timer once executed
                }, longPressThreshold);
            });

            cell.addEventListener('touchend', function(e) {
                if (gameover) return;
                if (longPressTimer) {
                    // If the long press timer is still active, it means it was a short tap
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                    // This is a short tap action
                    if (this.classList.contains('number-cell')) {
                        chordClick(parseInt(this.getAttribute('data-x')), parseInt(this.getAttribute('data-y')));
                    } else {
                        clickCell(this);
                    }
                }
                // If longPressTimer was null, it means longPressTimer executed (flagged) or was cleared by touchmove.
                // In either case, no short tap action should occur.
            });

            cell.addEventListener('touchmove', function(e) {
                if (gameover) return;
                // If a long press timer is active, check for significant movement
                if (longPressTimer) {
                    var currentX = e.touches[0].clientX;
                    var currentY = e.touches[0].clientY;
                    var distance = Math.sqrt(
                        Math.pow(currentX - touchStartX, 2) + Math.pow(currentY - touchStartY, 2)
                    );
                    if (distance > moveThreshold) { // Moved more than threshold pixels
                        clearTimeout(longPressTimer);
                        longPressTimer = null; // Cancel the long press
                    }
                }
            });

            // --- Mouse Event Handlers (for desktop/Firefox compatibility) ---
            cell.addEventListener('click', function(e) {
                if (gameover) return;
                // If a touch event just handled this, don't re-process for click
                // (This is a simplified check, a more robust one might use a flag)
                if (e.detail === 0) return; // 'e.detail' is 0 for synthetic clicks, non-zero for real clicks

                if (this.classList.contains('number-cell')) {
                    chordClick(parseInt(this.getAttribute('data-x')), parseInt(this.getAttribute('data-y')));
                } else {
                    clickCell(this);
                }
            });

            cell.addEventListener('contextmenu', function(e) {
                e.preventDefault(); // Prevent browser's context menu
                if (gameover) return;
                flagCell(this);
            });
            // --- End Event Handlers ---
        }
    }
}

// Flag Cell
function flagCell(cell) {
    if (gameover) return;
    if (cell.classList.contains('revealed')) return;

    if (cell.innerText === '*') {
        cell.innerText = '';
        flags--;
    } else if (flags < 15) { // Assuming 15 mines, don't allow flagging more than mines
        cell.innerText = '*';
        flags++;
    }
    checkWin();
}


// Click on Cell
function clickCell(cell) {
    if (gameover) return;
    if (cell.classList.contains('revealed') || cell.innerText === '*') return; // Already revealed or flagged

    var x = parseInt(cell.getAttribute('data-x'));
    var y = parseInt(cell.getAttribute('data-y'));

    if (mineLocations[x][y]) {
        gameOver(cell);
    } else {
        var count = countAdjacentMines(x, y);
        cell.classList.add('revealed');
        if (count > 0) {
            cell.innerText = count;
            cell.classList.add('number-cell'); // Add a class to identify number cells
            checkWin();
        } else {
            checkWin();
            revealAdjacentCells(x, y); // Only reveal adjacent if count is 0
        }
    }
}

// Count Adjacent Mines
function countAdjacentMines(x, y) {
    var count = 0;
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            var newX = x + i;
            var newY = y + j;
            if (newX >= 0 && newX < width && newY >= 0 && newY < width) {
                if (mineLocations[newX][newY]) {
                    count++;
                }
            }
        }
    }
    return count;
}

// Reveal Adjacent Cells (Flood Fill from 0-count cell)
function revealAdjacentCells(x, y) {
    if (gameover) return; // Important to stop recursion if game ends

    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            // This is crucial: don't click the original cell again.
            if (i === 0 && j === 0) continue;

            var newX = x + i;
            var newY = y + j;

            if (newX >= 0 && newX < width && newY >= 0 && newY < width) {
                var adjacentCell = document.querySelector('[data-x="'+newX+'"][data-y="'+newY+'"]');
                if (adjacentCell && !adjacentCell.classList.contains('revealed') && adjacentCell.innerText !== '*') {
                    clickCell(adjacentCell); // Recursively click unrevealed, unflagged neighbors
                }
            }
        }
    }
}

// Chord Click (clicking a revealed number cell)
function chordClick(x, y) {
    if (gameover) return;

    var clickedCell = document.querySelector('[data-x="'+x+'"][data-y="'+y+'"]');
    if (!clickedCell || !clickedCell.classList.contains('number-cell')) {
        return; // Should only be called on revealed number cells
    }

    var expectedMineCount = parseInt(clickedCell.innerText);
    var actualFlagCount = 0;
    var unrevealedNeighbors = []; // To store neighbors to reveal/check

    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue; // Don't check the cell itself
            var newX = x + i;
            var newY = y + j;
            if (newX >= 0 && newX < width && newY >= 0 && newY < width) {
                var neighborCell = document.querySelector('[data-x="'+newX+'"][data-y="'+newY+'"]');
                if (neighborCell) {
                    if (neighborCell.innerText === '*') { // Check if flagged
                        actualFlagCount++;
                    }
                    if (!neighborCell.classList.contains('revealed')) {
                        unrevealedNeighbors.push(neighborCell);
                    }
                }
            }
        }
    }

    if (actualFlagCount === expectedMineCount) {
        // If the number of flags matches the number on the cell,
        // attempt to reveal all unrevealed, unflagged neighbors.
        // This can lead to game over if you mis-flagged.
        // Replaced forEach with a standard for loop
        for (var k = 0; k < unrevealedNeighbors.length; k++) {
            var neighborCell = unrevealedNeighbors[k];
            if (gameover) return; // Stop if game ends during the chord click
            if (neighborCell.innerText !== '*') { // If not flagged
                var nx = parseInt(neighborCell.getAttribute('data-x'));
                var ny = parseInt(neighborCell.getAttribute('data-y'));
                if (mineLocations[nx][ny]) {
                    // If you reveal an unflagged mine during a chord click, it's game over
                    gameOver(neighborCell);
                } else {
                    clickCell(neighborCell);
                }
            }
        }
    }
    // If flag counts don't match, do nothing (standard Minesweeper behavior).
}


// Game Over
function gameOver(hitCell) {
    gameover = true;
    var cells = document.querySelectorAll('.cell');
    // Replaced forEach with a standard for loop
    for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        var x = parseInt(c.getAttribute('data-x'));
        var y = parseInt(c.getAttribute('data-y'));
        if (mineLocations[x][y]) {
            c.classList.add('mine');
            c.innerText = "*"; // Show all mines
        }
        c.style.pointerEvents = 'none'; // Disable further clicks
    }
    if (hitCell) {
        hitCell.classList.add('hit-mine'); // Highlight the mine that was hit
    }
    alert('Game Over!'); // Consider a less intrusive UI for mobile
}

// Check for Win
function checkWin() {
    var cells = document.querySelectorAll('.cell');
    var revealedCount = 0;
    var nonMineCount = 0;

    for (var i = 0; i < width; i++) {
        for (var j = 0; j < width; j++) {
            if (!mineLocations[i][j]) {
                nonMineCount++;
            }
        }
    }

    // Replaced forEach with a standard for loop
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        if (cell.classList.contains('revealed')) {
            revealedCount++;
        }
    }

    if (revealedCount === nonMineCount) {
        gameover = true;
        // Replaced forEach with a standard for loop
        for (var i = 0; i < cells.length; i++) {
            var c = cells[i];
            c.style.pointerEvents = 'none'; // Disable further clicks
        }
        alert('You Win!'); // Consider a less intrusive UI for mobile
    }
}

// Start Game
function startGame() {
    // Reset game state for a new game
    gameover = false;
    flags = 0;
    createBoard(); // Recreate board with new mine locations

    // Ensure the first clicked cell is empty and has no adjacent mines
    var x, y, count;
    do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * width);
        count = countAdjacentMines(x, y);
    } while (mineLocations[x][y] || count > 0);

    var cell = document.querySelector('[data-x="'+x+'"][data-y="'+y+'"]');
    clickCell(cell);
}

// Initial game setup
startGame(); // Call startGame instead of createBoard directly to ensure initial empty click