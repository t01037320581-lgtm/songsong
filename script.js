const BOARD_SIZE = 10;
const GAME_SECONDS = 120;

const boardElement = document.getElementById("gameBoard");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const selectionSumElement = document.getElementById("selectionSum");
const helpDialog = document.getElementById("helpDialog");
const resultDialog = document.getElementById("resultDialog");

let board = [];
let score = 0;
let secondsLeft = GAME_SECONDS;
let timerId = null;
let dragging = false;
let selectedCells = [];
let hasStarted = false;

function randomApple() {
  return Math.floor(Math.random() * 9) + 1;
}

function createBoard() {
  board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, randomApple)
  );
}

function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const value = board[row][column];
      const apple = document.createElement("button");
      apple.type = "button";
      apple.className = "apple";
      apple.dataset.row = row;
      apple.dataset.column = column;
      apple.setAttribute("role", "gridcell");
      apple.setAttribute("aria-label", `행 ${row + 1}, 열 ${column + 1}, 사과 ${value === null ? "빈 칸" : value}`);
      apple.classList.toggle("empty", value === null);
      if (value !== null) {
        apple.innerHTML = '<span class="apple-eyes" aria-hidden="true"><i></i><i></i></span><span class="apple-number">' + value + '</span>';
      }
      boardElement.appendChild(apple);
    }
  }
}

function startGame() {
  clearInterval(timerId);
  createBoard();
  score = 0;
  secondsLeft = GAME_SECONDS;
  hasStarted = true;
  selectedCells = [];
  scoreElement.textContent = "0";
  updateTimer();
  renderBoard();
  document.querySelectorAll(".apple.empty").forEach((apple) => { apple.disabled = true; });
  timerId = setInterval(() => {
    secondsLeft -= 1;
    updateTimer();
    if (secondsLeft <= 0) finishGame();
  }, 1000);
}

function updateTimer() {
  const minutes = Math.floor(Math.max(0, secondsLeft) / 60);
  const seconds = Math.max(0, secondsLeft) % 60;
  timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function finishGame() {
  clearInterval(timerId);
  timerId = null;
  hasStarted = false;
  dragging = false;
  document.getElementById("finalScore").textContent = score;
  document.getElementById("resultTitle").textContent = score >= 100 ? "대단한 솜씨예요!" : "수고했어요!";
  resultDialog.showModal();
}

function getCellFromPoint(clientX, clientY) {
  for (const apple of boardElement.querySelectorAll(".apple")) {
    const rect = apple.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      return apple;
    }
  }
  return null;
}

function updateSelection(startCell, endCell) {
  const startRow = Number(startCell.dataset.row);
  const startColumn = Number(startCell.dataset.column);
  const endRow = Number(endCell.dataset.row);
  const endColumn = Number(endCell.dataset.column);
  const top = Math.min(startRow, endRow);
  const bottom = Math.max(startRow, endRow);
  const left = Math.min(startColumn, endColumn);
  const right = Math.max(startColumn, endColumn);

  selectedCells = [];
  document.querySelectorAll(".apple.selected").forEach((apple) => apple.classList.remove("selected"));

  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) {
      if (board[row][column] !== null) {
        const apple = boardElement.querySelector(`[data-row="${row}"][data-column="${column}"]`);
        apple?.classList.add("selected");
        selectedCells.push({ row, column });
      }
    }
  }

  const sum = selectedCells.reduce((total, cell) => total + board[cell.row][cell.column], 0);
  showSelectionSum(sum, endCell);
}

function showSelectionSum(sum, endCell) {
  if (!selectedCells.length) return;
  const rect = endCell.getBoundingClientRect();
  const boardRect = boardElement.getBoundingClientRect();
  selectionSumElement.textContent = sum;
  selectionSumElement.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
  selectionSumElement.style.top = `${rect.top - boardRect.top}px`;
  selectionSumElement.style.background = sum === 10 ? "#5f9d43" : "#332f2a";
  selectionSumElement.style.display = "grid";
}

let selectionStart = null;

boardElement.addEventListener("pointerdown", (event) => {
  if (!hasStarted) return;
  const apple = event.target.closest(".apple");
  if (!apple) return;
  dragging = true;
  selectionStart = apple;
  boardElement.setPointerCapture?.(event.pointerId);
  updateSelection(apple, apple);
  event.preventDefault();
});

boardElement.addEventListener("pointermove", (event) => {
  if (!dragging || !selectionStart) return;
  const apple = getCellFromPoint(event.clientX, event.clientY);
  if (apple) updateSelection(selectionStart, apple);
});

function finishSelection() {
  if (!dragging) return;
  dragging = false;
  const sum = selectedCells.reduce((total, cell) => total + board[cell.row][cell.column], 0);

  if (selectedCells.length && sum === 10) {
    const apples = selectedCells.map((cell) =>
      boardElement.querySelector(`[data-row="${cell.row}"][data-column="${cell.column}"]`)
    );
    apples.forEach((apple) => apple?.classList.add("removing"));

    selectedCells.forEach((cell) => { board[cell.row][cell.column] = null; });
    score += selectedCells.length * 10;
    scoreElement.textContent = score;
    setTimeout(() => apples.forEach((apple) => {
      if (!apple) return;
      apple.classList.add("empty");
      apple.textContent = "";
    }), 210);
  }

  document.querySelectorAll(".apple.selected").forEach((apple) => apple.classList.remove("selected"));
  selectedCells = [];
  selectionSumElement.style.display = "none";
}

boardElement.addEventListener("pointerup", finishSelection);
boardElement.addEventListener("pointercancel", finishSelection);
boardElement.addEventListener("pointerleave", (event) => {
  if (event.buttons === 0) finishSelection();
});

boardElement.addEventListener("contextmenu", (event) => event.preventDefault());

document.getElementById("newGameButton").addEventListener("click", startGame);
document.getElementById("playAgainButton").addEventListener("click", () => {
  resultDialog.close();
  startGame();
});
document.getElementById("helpButton").addEventListener("click", () => helpDialog.showModal());
document.getElementById("closeHelpButton").addEventListener("click", () => helpDialog.close());
document.getElementById("startFromHelpButton").addEventListener("click", () => {
  helpDialog.close();
  startGame();
});

createBoard();
renderBoard();
updateTimer();

if (!localStorage.getItem("appleGameHelpSeen")) {
  helpDialog.showModal();
  localStorage.setItem("appleGameHelpSeen", "true");
}
