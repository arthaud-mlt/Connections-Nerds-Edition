const groups = [
  { name: "FRUITS", words: ["APPLE", "BANANA", "GRAPE", "ORANGE"], color: "#f7de6c" },  // jaune
  { name: "COLORS", words: ["RED", "BLUE", "GREEN", "YELLOW"], color: "#afc4ef" },     // bleu
  { name: "ANIMALS", words: ["LION", "TIGER", "BEAR", "WOLF"], color: "#a0c35a" },     // vert
  { name: "PLANETS", words: ["MARS", "VENUS", "JUPITER", "SATURN"], color: "#b881c7" } // violet
];


let allWords = groups.flatMap(group => group.words);
let shuffledWords = shuffle([...allWords]);
let foundGroups = [];
let selected = [];
let lives = 4;
let testedGroups = [];

const grid = document.getElementById("grid");
const message = document.getElementById("message");

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function buildGrid() {
  const previousPositions = new Map();

  document.querySelectorAll(".word").forEach(el => {
    const rect = el.getBoundingClientRect();
    previousPositions.set(el.textContent, rect);
  });

  grid.innerHTML = "";

  // Afficher groupes trouvés en gros blocs
  foundGroups.forEach(groupName => {
    const group = groups.find(g => g.name === groupName);

    const groupBlock = document.createElement("div");
    groupBlock.classList.add("group-block");
    groupBlock.style.gridColumn = "span 4"; 
    groupBlock.style.backgroundColor = group.color;
    groupBlock.innerHTML = `<div><strong>${group.name}</strong></div><div>${group.words.join(", ")}</div>`;

    grid.appendChild(groupBlock);
  });

  // Afficher mots restants
  shuffledWords.forEach(word => {
    if (foundGroups.some(groupName =>
      groups.find(g => g.name === groupName).words.includes(word)
    )) return;

    const btn = document.createElement("button");
    btn.textContent = word;
    btn.classList.add("word");

    btn.addEventListener("click", () => selectWord(btn, word));
    grid.appendChild(btn);
  });

  // Après ajout, calculer nouvelles positions et animer différence
  document.querySelectorAll(".word").forEach(el => {
    const oldRect = previousPositions.get(el.textContent);
    const newRect = el.getBoundingClientRect();

    if (!oldRect) return;

    const deltaX = oldRect.left - newRect.left;
    const deltaY = oldRect.top - newRect.top;

    if (deltaX || deltaY) {
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      el.style.transition = 'transform 0s';

      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.5s ease';
        el.style.transform = '';
      });

      el.addEventListener('transitionend', () => {
        el.style.transition = '';
        el.style.transform = '';
      }, { once: true });
    }
  });
}

function shuffleGrid() {
  shuffledWords = shuffle([...allWords]);
  selected = [];
  updateLivesDisplay();
  message.textContent = "";
  buildGrid();
}

function selectWord(btn, word) {
  if (btn.classList.contains("correct")) return;

  // Si déjà sélectionné, on le retire
  if (selected.includes(word)) {
    selected = selected.filter(w => w !== word);
    btn.classList.remove("selected");
  } 
  // Si pas encore sélectionné et qu'on a moins de 4 mots, on l’ajoute
  else if (selected.length < 4) {
    selected.push(word);
    btn.classList.add("selected");
  }

  updateSubmitButton(); // met à jour l'état du bouton Submit
}

// Fonction utilitaire pour faire une pause (delay)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction qui anime les sauts avec délai entre chaque
async function animateJump(buttons) {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.add("jump");      // ajoute la classe d'animation
    await delay(250);                      // durée du saut (800 ms pour un saut plus tranquille)
    buttons[i].classList.remove("jump");  // retire la classe pour pouvoir réanimer plus tard
    await delay(5);                      // délai entre chaque saut
  }
}

async function checkSelection() {
  if (selected.length !== 4) return;

  const sorted = selected.slice().sort();

  // Vérifie si ce groupe a déjà été testé
  if (isAlreadyTested(sorted)) {
    updateSubmitButton();
    return;
  }

  // Ajoute ce groupe aux groupes testés
  testedGroups.push(sorted);

  // Vérifie si c'est un groupe correct
  let correctGroup = groups.find(g =>
    g.words.slice().sort().every((word, i) => word === sorted[i])
  );

  if (correctGroup) {
    // Animation des bons mots
    const buttons = Array.from(document.querySelectorAll(".word"))
      .filter(btn => selected.includes(btn.textContent));

    await animateJump(buttons);

    foundGroups.push(correctGroup.name);

    buttons.forEach(btn => {
      btn.classList.remove("selected");
      btn.classList.add("correct");
    });

    buildGrid();
    selected = [];
    updateSubmitButton();

    if (foundGroups.length === groups.length) {
      showGameSummary();
    }

  } else {
    // Vérifie si c'est un "One Away"
    let isOneAway = groups.some(group => {
      const matchCount = selected.filter(word => group.words.includes(word)).length;
      return matchCount === 3;
    });

    if (isOneAway) {
      showTemporaryMessage("One away...");
    }

    // Perte d'une vie
    lives--;
    updateLivesDisplay();
    
    if (lives <= 0) {
  showGameSummary();
}


    // Animation de shake + désélection
    document.querySelectorAll(".word.selected").forEach(btn => {
      btn.classList.add("shake");
      btn.addEventListener("animationend", () => {
        btn.classList.remove("shake", "selected");
      }, { once: true });
    });

    selected = [];
    updateSubmitButton();
  }
}


function updateSubmitButton() {
  if (selected.length !== 4) {
    submitBtn.disabled = true;
    return;
  }
  
  const sorted = selected.slice().sort();

  // Désactiver submit si groupe déjà testé
  const alreadyTested = testedGroups.some(testedGroupWords => 
    testedGroupWords.slice().sort().every((w, i) => w === sorted[i])
  );

  submitBtn.disabled = alreadyTested;
}

function deselectAll() {
  selected = [];
  document.querySelectorAll(".word.selected").forEach(btn => btn.classList.remove("selected"));
  updateSubmitButton(); // <== mise à jour aussi ici
}

  
function updateLivesDisplay() {
  const lifeDots = "● ".repeat(lives).trim();
  document.getElementById("life-dots").textContent = lifeDots;
}

function revealRemainingGroups() {
  groups.forEach(group => {
    if (!foundGroups.includes(group.name)) {
      group.words.forEach(word => {
        document.querySelectorAll(".word").forEach(btn => {
          if (btn.textContent === word && !btn.classList.contains("correct")) {
            btn.classList.add("correct");
            btn.classList.remove("selected");
          }
        });
      });
      foundGroups.push(group.name);
    }
  });
}

const submitBtn = document.getElementById("submit-btn");


function isAlreadyTested(selectedGroup) {
  // selectedGroup est un array de 4 mots triés
  return testedGroups.some(tested =>
    tested.length === 4 && tested.every((word, i) => word === selectedGroup[i])
  );
}

function updateSubmitButton() {
  if (selected.length !== 4) {
    submitBtn.disabled = true;
  } else {
    const sortedSelected = selected.slice().sort();
    submitBtn.disabled = isAlreadyTested(sortedSelected);
  }
}

function showTemporaryMessage(text, duration = 800) {
  const tempMsg = document.getElementById("temp-message");
  tempMsg.textContent = text;
  tempMsg.classList.add("show");
  clearTimeout(tempMsg._timeoutId);
  tempMsg._timeoutId = setTimeout(() => {
    tempMsg.classList.remove("show");
  }, duration);
}

function emojiFromColor(color) {
  switch (color) {
    case "#f7de6c": return "🟨"; // jaune
    case "#afc4ef": return "🟦"; // bleu
    case "#a0c35a": return "🟩"; // vert
    case "#b881c7": return "🟪"; // violet
    default: return "⬜";        // inconnu
  }
}


function showGameSummary() {
  const summaryContainer = document.createElement("div");
  summaryContainer.style.marginTop = "30px";
  summaryContainer.style.padding = "10px";
  summaryContainer.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
  summaryContainer.style.borderRadius = "10px";
  summaryContainer.style.display = "flex";
  summaryContainer.style.flexDirection = "column";
  summaryContainer.style.alignItems = "center"; // ✅ centrer horizontalement
  summaryContainer.style.textAlign = "center";  // ✅ centrer le texte aussi


  const summaryTitle = document.createElement("h2");
  summaryTitle.textContent = "Connections Nerds Edition";
  summaryTitle.style.marginBottom = "10px";
  summaryContainer.appendChild(summaryTitle);

  const summaryLines = testedGroups.map(groupWords => {
    return groupWords.map(word => {
      const group = groups.find(g => g.words.includes(word));
      if (!group) return "⬜";
      return foundGroups.includes(group.name) ? emojiFromColor(group.color) : "⬜";
    }).join("");
  });

  const resultDisplay = document.createElement("pre");
  resultDisplay.textContent = summaryLines.join("\n");
  resultDisplay.style.fontSize = "24px";
  resultDisplay.style.marginBottom = "10px";
  resultDisplay.style.textAlign = "center";
  resultDisplay.style.fontFamily = "monospace";
  summaryContainer.appendChild(resultDisplay);


  const shareBtn = document.createElement("button");
  shareBtn.textContent = "Share Results";
  shareBtn.className = "share-btn";
  shareBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(summaryLines.join("\n"))
      .catch(() => alert("Failed to copy."));
  });
  summaryContainer.appendChild(shareBtn);

  document.body.appendChild(summaryContainer);
}


// Initialisation
buildGrid();


