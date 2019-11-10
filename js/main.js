// Getting canvas from html
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Maze config
const mazeSize = 20;
const maze = [];

// Display cells config
const cellSize = 28;
const cellOffset = 30;

// Flags to draw obstacles
let drawingWalls = false;
let removingWalls = false;

// Algorithm variables
let openSet = [];
let closedSet = [];
let path = [];
let done = false;

// Visualization Variables
let start = false;

// Node class
class Node {
    constructor(x, y) {
        this.f = Number.POSITIVE_INFINITY;
        this.g = Number.POSITIVE_INFINITY;
        this.h = Number.POSITIVE_INFINITY;
        this.neighbors = [];

        this.x = x;
        this.y = y;

        this.state = 'FREE';
        this.previous = null;
        this.wall = false;
    }

    setNeighbors(maze) {
        if (this.x != mazeSize - 1)
            this.neighbors.push(maze[this.x + 1][this.y]);
        if (this.x != 0)
            this.neighbors.push(maze[this.x - 1][this.y]);
        if (this.y != mazeSize - 1)
            this.neighbors.push(maze[this.x][this.y + 1]);
        if (this.y != 0)
            this.neighbors.push(maze[this.x][this.y - 1]);
        if (this.x != mazeSize - 1 && this.y != mazeSize - 1)
            this.neighbors.push(maze[this.x + 1][this.y + 1]);
        if (this.x != 0 && this.y != 0)
            this.neighbors.push(maze[this.x - 1][this.y - 1]);
        if (this.x != mazeSize - 1 && this.y != 0)
            this.neighbors.push(maze[this.x + 1][this.y - 1]);
        if (this.x != 0 && this.y != mazeSize - 1)
            this.neighbors.push(maze[this.x - 1][this.y + 1]);
    }
}

// Defaults position of Nodes
let startPosition = { x: 0, y: 0 };
let targetPosition = { x: mazeSize - 1, y: mazeSize - 1 };

let startNode = new Node(startPosition.x, startPosition.y);
let targetNode = new Node(targetPosition.x, targetPosition.y);

// Get position from inputs
function getNodesPosition() {
    const startNodeInputs = [document.getElementById('startX'), document.getElementById('startY')];
    const targetNodeInputs = [document.getElementById('targetX'), document.getElementById('targetY')];
    startPosition = { x: startNodeInputs[1].value, y: startNodeInputs[0].value };
    targetPosition = { x: targetNodeInputs[1].value, y: targetNodeInputs[0].value };
}

// Auxiliar function, return if a [i,j] position is a node;
function sameCell(fristNode, secondNode) {
    return fristNode.x == secondNode.x && fristNode.y == secondNode.y;
}

// Axuliar function, return a color based on a state
function getFillStyle(node) {
    if (node.state == 'START')
        return 'red';
    else if (node.state == 'TARGET')
        return 'blue';
    else if (node.state == 'WALL')
        return 'gray';
    else if (node.state == 'CLOSE')
        return 'yellow'
    else if (node.state == 'OPEN')
        return 'green'
    else if (node.state == 'PATH')
        return 'orange'
    else
        return 'white';
}

// Auxiliar function, return a heuristic distance 
function heuristic(fristNode, secondNode) {
    return Math.abs(secondNode.x - fristNode.x) + Math.abs(secondNode.y - fristNode.y);
}

// Init the maze
function initMaze() {
    for (let i = 0; i < mazeSize; i++) {
        maze[i] = new Array(mazeSize);
        for (let j = 0; j < mazeSize; j++) {
            maze[i][j] = new Node(i, j);
        }
    }
}

// Clear paths in the maze 
function cleanMaze() {
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            if (maze[i][j].state === 'OPEN' || maze[i][j].state === 'PATH') {
                maze[i][j].state = 'FREE';
            }
        }
    }
}

// Set neighbours, start and target nodes
function setNeighbors() {
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            maze[i][j].setNeighbors(maze);
            if (sameCell(maze[i][j], startNode)) {
                maze[i][j].state = 'START';
                startNode = maze[i][j];
                startNode.g = 0;
                startNode.h = heuristic(startNode, targetNode);
                startNode.f = startNode.g + startNode.h;
            } else if (sameCell(maze[i][j], targetNode)) {
                maze[i][j].state = 'TARGET';
                targetNode = maze[i][j];
            }
        }
    }
    start = false;
}

function clearMaze() {
    setNodesPositions();
    initMaze();
    setNeighbors();
}

function clearWalls() {
    done = false;
    clearMaze();
}

function clearBoard() {
    done = false;
    setNodesPositions();
    cleanMaze();
    setNeighbors();

}

function startSearch() {
    start = true;
    closedSet = [];
    openSet = [startNode];
    path = [];
}


// Puting  nodes locations
function setNodesPositions() {
    getNodesPosition();
    startNode = new Node(startPosition.x, startPosition.y);
    targetNode = new Node(targetPosition.x, targetPosition.y);
}


// Auxiliar function, returns the the col,row of a cell based on mouse position
function getMousePos(canvas, evt) {

    let rect = canvas.getBoundingClientRect(),
        scaleX = 600 / 25,    // relationship bitmap vs. element for X
        scaleY = 600 / 25;  // relationship bitmap vs. element for Y

    return {
        column: Math.floor((evt.clientX - rect.left) / 30),
        row: Math.floor((evt.clientY - rect.top) / 30)
    };
}

// Handler functions to get mouse events and draw obstacles

canvas.onmousedown = (event) => {
    if (event.button == 0) {
        drawObstacle(getMousePos(canvas, event));
        drawingWalls = true;
    }
    if (event.button == 2) {
        removingWalls = true;
        removeObstacle(getMousePos(canvas, event));
    }
}

canvas.onmouseup = (event) => {
    drawingWalls = false;
    removingWalls = false;
}

canvas.onmousemove = (event) => {
    if (drawingWalls)
        drawObstacle(getMousePos(canvas, event));
    else if (removingWalls)
        removeObstacle(getMousePos(canvas, event));
}

function drawObstacle({ column, row }) {
    if (maze[column][row].state == 'FREE') {
        maze[column][row].state = 'WALL';
        maze[column][row].wall = true;
    }
}

function removeObstacle({ column, row }) {
    if (maze[column][row].state == 'WALL') {
        maze[column][row].state = 'FREE';
        maze[column][row].wall = false;
    }
}

// End of handler functions to draw obstacles

clearMaze();
//openSet.push(startNode);

// Update
function update() {
    //Visualization
    if (start) {
        // Algorithm
        if (openSet.length > 0) {
            let current = 0;
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f <= openSet[current].f)
                    current = i;
            }

            current = openSet[current];

            if (current === targetNode) {
                // Done
                console.log('DONE!');
                path = [];
                let iterator = current;
                while (iterator.previous) {
                    path.push(iterator.previous);
                    iterator = iterator.previous;
                }
                done = true;
                start = false;
            }


            // Removing current of openSet
            for (let i = openSet.length - 1; i >= 0; i--) {
                if (openSet[i] === current) {
                    openSet.splice(i, 1);
                    closedSet.push(current);
                }
            }

            let neighbors = current.neighbors;
            for (let i = 0; i < neighbors.length; i++) {
                neighbor = neighbors[i];

                if (closedSet.includes(neighbor) || neighbor.wall) {
                    continue;
                }

                let gScore = current.g + 1;
                let gScoreBest = false;

                if (!openSet.includes(neighbor)) {
                    gScoreBest = true;
                    neighbor.h = heuristic(neighbor, targetNode);
                    openSet.push(neighbor);
                } else if (gScore <= neighbor.g) {
                    gScoreBest = true;
                }

                if (gScoreBest) {
                    neighbor.previous = current;
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                }

            }

        } else {
            // No solution
            console.log('NO SOLUTION');
        }

        openSet.forEach(node => {
            if (!sameCell(node, startNode) && !sameCell(node, targetNode) && !node.wall)
                node.state = 'OPEN';
        });

        path.forEach(node => {
            if (!sameCell(node, startNode) && !sameCell(node, targetNode))
                node.state = 'PATH';
        });
    }

    // Cleaning the canvas
    context.fillStyle = 'black';
    context.clearRect(0, 0, 600, 600);

    // Drawing cells
    for (let i = 0; i < mazeSize; i++) {
        for (let j = 0; j < mazeSize; j++) {
            context.fillStyle = getFillStyle(maze[i][j]);
            context.fillRect(i * cellOffset, j * cellOffset, cellSize, cellSize);
        }
    }

    requestAnimationFrame(update);
}

update();