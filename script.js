
const board = document.getElementById('board');
const width = 10;
var mineLocations = [];
var flags = 0;
var gameover = false;

// Create Board
function createBoard() {
    // recreate bellow with [] and push instead of Array
    //mineLocations = Array(width).fill(null).map(() => Array(width).fill(false));
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

            cell.addEventListener('click', function(e) {
                if (cell.classList.contains('number-cell')) {
                    revealAdjacentCells(parseInt(cell.getAttribute('data-x')), parseInt(cell.getAttribute('data-y')));
                } else {
                    clickCell(cell);
                }
            });

            cell.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                flagCell(cell);
            });
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
    } else {
        cell.innerText = '*';
        flags++;
    }
    checkWin();
}


// Click on Cell
function clickCell(cell) {
    if (gameover) return;
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
            revealAdjacentCells(x, y);
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

// Reveal Adjacent Cells
function revealAdjacentCells(x, y) {
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            var newX = x + i;
            var newY = y + j;
            if (newX >= 0 && newX < width && newY >= 0 && newY < width) {
                var adjacentCell = document.querySelector('[data-x="'+newX+'"][data-y="'+newY+'"]');
                if (adjacentCell && !adjacentCell.classList.contains('revealed') && adjacentCell.innerText !== '*') {
                    if (gameover) return;
                    checkWin();
                    if (gameover) return;
                    clickCell(adjacentCell);
                }
            }
        }
    }
}

// Game Over
function gameOver(cell) {
    gameover = true;
    var cells = document.querySelectorAll('.cell');
    for (var c of cells) {
        var x = parseInt(c.getAttribute('data-x'));
        var y = parseInt(c.getAttribute('data-y'));
        if (mineLocations[x][y]) {
            c.classList.add('mine');
            c.innerText = "*";
        }
    };
    alert('Game Over!');
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

    for (var cell of cells) {
        if (cell.classList.contains('revealed')) {
            revealedCount++;
        }
    };

    if (revealedCount === nonMineCount) {
        gameover = true;
        alert('You Win!');
    }
}



// Start Game
function startGame() {
    var x, y, count;
    do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * width);
        count = countAdjacentMines(x, y);
    } while (mineLocations[x][y] || count > 0);

    var cell = document.querySelector('[data-x="'+x+'"][data-y="'+y+'"]');
    clickCell(cell);
}


createBoard();

startGame();

