
const board = document.getElementById('board');
const width = 10;
let mineLocations = [];
let flags = 0;
let gameover = false;

// Create Board
function createBoard() {
    mineLocations = Array(10).fill(null).map(() => Array(10).fill(false));
    // Generate random mine locations
    let mineCount = 15;
    while (mineCount > 0) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * width);
        if (!mineLocations[x][y]) {
            mineLocations[x][y] = true;
            mineCount--;
        }
    }

    for (let i = 0; i < width; i++) {
        for (let j = 0; j < width; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-x', i);
            cell.setAttribute('data-y', j);
            board.appendChild(cell);

            cell.addEventListener('click', function(e) {
                clickCell(cell);
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
}


// Click on Cell
function clickCell(cell) {
    if (gameover) return;
    let x = parseInt(cell.getAttribute('data-x'));
    let y = parseInt(cell.getAttribute('data-y'));

    if (mineLocations[x][y]) {
        gameOver(cell);
    } else {
        let count = countAdjacentMines(x, y);
        cell.classList.add('revealed');
        if (count > 0) {
            cell.innerText = count;
        } else {
            revealAdjacentCells(x, y);
        }
    }
}

// Count Adjacent Mines
function countAdjacentMines(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            let newX = x + i;
            let newY = y + j;
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
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            let newX = x + i;
            let newY = y + j;
            if (newX >= 0 && newX < width && newY >= 0 && newY < width) {
                let adjacentCell = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
                if (adjacentCell && !adjacentCell.classList.contains('revealed')) {
                    clickCell(adjacentCell);
                }
            }
        }
    }
}

// Game Over
function gameOver(cell) {
    gameover = true;
    let cells = document.querySelectorAll('.cell');
    cells.forEach(c => {
        let x = parseInt(c.getAttribute('data-x'));
        let y = parseInt(c.getAttribute('data-y'));
        if (mineLocations[x][y]) {
            c.classList.add('mine');
            c.innerText = "*";
        }
    });
    alert('Game Over!');
}

createBoard();
