const checklist = document.getElementById("checklist");
const loadButton = document.getElementById("loadButton");
const sourceInput = document.getElementById("sourceInput");
const darkToggle = document.getElementById("darkModeToggle");
const nextStepButton = document.getElementById("nextStepButton");
const showLoadButton = document.getElementById("showLoadButton");
const controls = document.getElementById("controls");
const autoScroll = document.getElementById('autoScrollToggle');
const body = document.body;

// ---------------- Dark Mode ----------------
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  darkToggle.textContent = "☀️ Light Mode";
}

darkToggle.addEventListener("click", () => {
  const isDark = body.classList.toggle("dark");
  darkToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

//---------------Auto Scroll -------------------
if (localStorage.getItem("scroll") === "auto"){
    if(autoScroll.checked === false){autoScroll.checked = true};
}

autoScroll.addEventListener("click",() =>{
    const isAuto = autoScroll.checked;
    localStorage.setItem("scroll", isAuto ? "auto" : "man");
})


// ---------------- Checklist State ----------------
function saveState() {
  const state = {};
  checklist.querySelectorAll('input[type="checkbox"]').forEach(cb => state[cb.id] = cb.checked);
  localStorage.setItem("checklistState", JSON.stringify(state));
}

function loadState() {
  const state = JSON.parse(localStorage.getItem("checklistState") || "{}");
  checklist.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = !!state[cb.id]);
}

// ---------------- Highlight Next Leaf ----------------
function highlightNext() {
  checklist.querySelectorAll('li').forEach(li => li.classList.remove('highlight'));
  const allCheckboxes = Array.from(checklist.querySelectorAll('input[type="checkbox"]'));
  const next = allCheckboxes.find(cb => {
    if (cb.checked) return false;
    const li = cb.closest('li');
    const childCheckboxes = li.querySelectorAll(':scope > ul input[type="checkbox"]');
    return childCheckboxes.length === 0;
  });
  if (next) {
    const li = next.closest('li');
    li.classList.add('highlight');
    
    if(autoScroll.checked){
        li.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }else{

    }
    
  }
}

// ---------------- Build Checklist ----------------
function buildChecklist(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  checklist.innerHTML = "";
  let currentParent = null;
  let sublist = null;

  lines.forEach((line,i) => {
    if (!line.startsWith("-")) {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "main-" + i;
      const label = document.createElement("label");
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(line));
      li.appendChild(label);
      const ul = document.createElement("ul");
      li.appendChild(ul);
      checklist.appendChild(li);
      currentParent = li;
      sublist = ul;

      checkbox.addEventListener("change", () => {
        ul.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checkbox.checked);
        saveState();
        highlightNext();
      });
    } else if (currentParent) {
      const subLi = document.createElement("li");
      const subCheckbox = document.createElement("input");
      subCheckbox.type = "checkbox";
      subCheckbox.id = "sub-" + i;
      const subLabel = document.createElement("label");
      subLabel.appendChild(subCheckbox);
      subLabel.appendChild(document.createTextNode(line.replace(/^-+\s*/, "")));
      subLi.appendChild(subLabel);
      sublist.appendChild(subLi);

      subCheckbox.addEventListener("change", () => {
        const subs = sublist.querySelectorAll('input[type="checkbox"]');
        const allChecked = [...subs].every(cb => cb.checked);
        const noneChecked = [...subs].every(cb => !cb.checked);
        const parentBox = currentParent.querySelector(':scope > label > input[type="checkbox"]');
        parentBox.indeterminate = !allChecked && !noneChecked;
        parentBox.checked = allChecked;
        saveState();
        highlightNext();
      });
    }
  });

  loadState();
  highlightNext();
}

// ---------------- Show Input Field ----------------
showLoadButton.addEventListener("click", () => {
  controls.classList.add("show");
  sourceInput.focus();
});

// ---------------- Load Route ----------------
loadButton.addEventListener("click", () => {
  const source = sourceInput.value.trim();
  if (!source) return alert("Please enter a file path or URL.");

  localStorage.setItem("lastChecklistFile", source);

  // Hide input field after loading
  controls.classList.remove("show");

  checklist.innerHTML = "<li>Loading checklist...</li>";
  fetch(source)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(text => buildChecklist(text))
    .catch(err => checklist.innerHTML = `<li style="color:red;">Error loading checklist: ${err.message}</li>`);
});

// ---------------- Next Step ----------------
nextStepButton.addEventListener("click", () => {
  highlightNext();
});

// ---------------- Load Last Used File ----------------
const lastFile = localStorage.getItem("lastChecklistFile");
if (lastFile) {
  sourceInput.value = lastFile;
  checklist.innerHTML = "<li>Loading checklist...</li>";
  fetch(lastFile)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(text => buildChecklist(text))
    .catch(err => checklist.innerHTML = `<li style="color:red;">Error loading checklist: ${err.message}</li>`);
}
