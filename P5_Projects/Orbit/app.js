const viewport = document.getElementById("viewport");
const stage = document.getElementById("stage");
const image = document.getElementById("dockImage");
const markerLayer = document.getElementById("markerLayer");
const berthTableBody = document.getElementById("berthTableBody");
const infoCsvInput = document.getElementById("infoCsvInput");
const importStatus = document.getElementById("importStatus");
const boatTooltip = document.getElementById("boatTooltip");

const BERTH_STORAGE_KEY = "dock-berth-admin-data";
const FEET_TO_PIXEL = 1.4;

const state = {
  scale: 1,
  maxScale: 8,
  x: 0,
  y: 0,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
};

let activePoints = [];
let berthDataById = {};

const embeddedMarkerCsv = `id,x,y
A57,468,147
A55,468,167
A53,468,187
A51,468,209
A49,468,230
A47,468,251
A45,468,271
A43,468,290
A41,468,306
A39,468,323
A37,468,337
A35,468,352
A33,468,368
A31,468,382
A29,468,397
A27,468,413
A25,468,432
A23,468,451
A21,468,468
A19,468,482
A17,468,500
A15,468,517
A13,468,533
A11,468,551
A9,468,568
A7,468,583
A5,468,599
A3,468,615
A1,468,629
A46,488,148
A44,488,171
A42,488,194
A40,488,214
A38,488,235
A36,488,259
A34,488,282
A32,488,303
A30,488,323
A28,488,344
A26,488,366
A24,488,389
A22,488,411
A20,488,431
A18,488,451
A16,488,475
A14,488,500
A12,488,522
A10,488,543
A8,488,562
A6,488,581
A4,488,604
A2,488,626
B47,700,145
B45,700,165
B43,700,189
B41,700,214
B39,700,237
B37,700,260
B35,700,285
B33,700,309
B31,700,330
B29,700,352
B27,700,374
B25,700,397
B23,700,419
B21,700,442
B19,700,463
B17,700,483
B15,700,501
B13,700,519
B11,700,539
B9,700,556
B7,700,574
B5,700,592
B3,700,609
B1,700,627
B46,720,151
B42,720,179
B40,720,204
B38,720,228
B36,720,250
B34,720,272
B32,720,292
B30,720,313
B28,720,335
B26,720,359
B24,720,383
B22,720,404
B20,720,424
B18,720,445
B16,720,467
B14,720,487
B12,720,506
B10,720,526
B8,720,546
B6,720,566
B4,720,596
B2,720,626`;

const embeddedBerthInfoCsv = `Berth,Owner,Make,Lenth,Beam,Name,Type
A01,Chris Small,Bayliner 18,18,8,NB3538620,P
A02,Matthew Greer,,25,9,SeaYa,P
A03,Wayne MacFarlane,Four Winds 21,21,6,On The Rocks,P
A04,Bill Teed,,40,14,Louisa,P
A05,MikeBoudreau,Pontoon,24,9,,P
A06,Brian Boyles,Bayliner,35,12,Blue Pearl,S
A07,Chris/ John Acker,Pontoon,24,8,,P
A08,Greg Evans,Hunter,30,12,Stellar,S
A09,Scott Robinson,Bowrider,26,8,James Tuition,P
A10,Andy Dort,Carver,32,12,Sudden Comfort,P
A11,Brian Johnston,Chaparral,23,8,13D26891,P
A12,Chris Bourque,Monterey,36,12,Libra,P
A13,Troy Downey,Reinell Bowrider,26,8,Therapy,P
A14,Dennis Oland,Grand Banks,42,14,Heritage,P
A15,Dan Thompson,Zodiac,24,8,NB7641073,P
A16,Val Streeter,Neptunus,55,16,Odyssey,P
A17,Gavin Clark,,,,,
A18,Gerry & Lynn McMackin,Saberline,36,13,Kokomo,P
A19,Jeff Macdonald,Campion bowrider ,21,8,Social Distance,P
A20,Harrison Teed,Carver,28,11,,P
A21,Drew Langille ,Starcraft,19,8,,
A22,Eric Maxwell,Catalina,36,12,Haristock,S
A23,Yanniv Isaacs,Bayliner,20,9,,P
A24,Rob Mclean,Catalina,38,13,Irish Ayes,S
A25,Gary Joyce,Bayliner,28,10,Solitude,P
A26,Mark Anderson,Catalina,36,12,,S
A27,Gary Collins,Mirage,27,10,Cruisin Away,S
A28,Andrew Jackson,Oday,28,10,Mountain Wind,S
A29,Angela Campbell,C&C,27,10,Lone Ranger,P
A30,John Lind,CS,34,11,Stardust,S
A31,Pieter VS,JetSki,,6,,P
A32,Bruce Hurst,Morgan,38,13,Tropical Dream,S
A33,Kyle Adams,Mirage,27,,Silhouette,S
A34,Larry Cain,Rinker,34,12,Rinker,P
A35,Darrell Boyce,,,,,
A36,Bill Richards,Catalina,42,14,Legasea5,S
A37,Graeme Stewart Robinson,C&C,25,9,About Time,S
A38,Rick Benson,Catalina,42,14,Tune Cat,S
A39,Sonny Urquhart,Searay,24,8,Rough Life,P
A40,Mark Collins,Catalina,32,11,Sparky,S
A41,Ryan Emmerson,,30,11,Tranquility,S
A42,Mike Dickie,Hunter,44,15,Dreams Come True,S
A43,Don Shephard,,31,10,Ultimate Investment,S
A44,Curt Balwin,Catalina,36,12,,S
A45,Doug Jenkins,O'Day,34,12,Remedy,S
A46,John Goodfellow,Pearson,42,13,Aggie,S
A47,Brad Melanson,,35,12,Winsome,S
A49,Andrew & Jessica McMackin,Doral,30,13,TBD,P
A51,Joel Forsythe,C&C,40,13,Josephine X,S
A53,Joe Foote,Bayliner,44,14,Two Sunrays,
A55,Dick Daigle,Niagara,35,12,Glory,S
A57,Dave MeKenna,Catalina,39,13,,S
B01,Lindsay Haines,Doral,25,7,,P
B02,David Methven,Sea Serpent,22,9,No G Morhua,P
B03,David Iles,Pontoon,21,8,Joint Venture,P
B04,Chris & Michelle Bourque,Doral,25,8,,P
B05,Dave Kimball,Yahama,23,8,,P
B06,Phil Doucet,Searay,27,9,,P
B07,Glen Kettlewell,Four Winns,26,9,NB278839,P
B08,Mike Georgoudis,Larsen,29,10,Larsen,P
B09,Chris Flemming,Rinker,24,8,TBD,P
B10,Troy MacLeod,Maxum,31,9,Outnumbered,P
B11,Chris Bates,Doral,27,8,,P
B12,John Zinc,Doral,27,10,Waterlot,P
B13,Mark Mcgraw,Maxum,25,8.5,As Prescribed,P
B14,Bob Barb Creamer,Bayliner,28,9,Muggs,P
B15,Mathieu Vachon,Wellcraft,26,8,,P
B16,Matt Acker,Edgewater,25,9,Nautoncall,P
B17,Andrew Jenkins,Rinker,27,8,Pura Vida,P
B18,Mike Walton,Rinker,35,11,Aqua Vino,P
B19,Horace Martin,Hunter,28,11,Finz2,S
B20,Steve Drummond,Searay,24,11,,p
B21,Michael Oland,Catalina,30,11,"Sea n:""Me",S
B22,Ryan Green,Dufour,30,10,Out of the Blue,s
B23,Gary Steeves,Catalina,36,12,Aluna,S
B24,Mark McSween,Hunter,33,12,Seas My Dreams,S
B25,Jennifer Coughlan,Rinker,31,12,,S
B26,Jeff Martin,Catalina,30,11,Odyssey II,S
B27,Frank & Kim McCormick,Catalina,34,12,Aquarius,S
B28,Phil St. Thomas,Cape Dory,34,12,Libby Too,S
B29,Mike Alexander,Hunter,30,11,Honalee,S
B30,Mike Cosman,Catilina,36,12,Sol Mate,S
B31,John Moir,Mirage,31,12,Mizar,S
B32,Brian Baker,Hughes,35,11,Key Of Sea,S
B33,Jonathan Simms,Bruce roberts,31,10.5,Sound of Silence,S
B34,Pierre deVillers,Hunter,32,11,Thunder Cloud,S
B35,Greg Colpitts,Catalina,40,13,Elixer,S
B36,Denis Marier,Beneteau,34,12,Dangiser,S
B37,David Lomas,Beneteau,38,12,TBD,S
B38,Paul Creamer,Catalina,36,12,Coffee Mate,S
B39,Charlie Cook,C&C,36,11.5,Fast Lane I,S
B40,Ruben Martinez,C&C,34,12,Chica,S
B41,Megan Moir,Catalina,36,12,,P
B42,Bob Milne,Catalina,42,14,Summer Breeze,S
B43,Dale Mott,Beneteau,42,13,Tadjana,S
B45,Phillip Massey,J Boat,35,11,Ringer,S
B46,Tom Evans,Post,42,16,LaBuena Vida,P
B47,Rafal Byczko,Sea Ray,26,8,Dilligaf,P`;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function render() {
  stage.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
}

function getMinScale() {
  const rect = viewport.getBoundingClientRect();
  return rect.height / image.naturalHeight;
}

function parseCsvRows(csvText) {
  const text = String(csvText || "").replace(/^\uFEFF/, "").trim();
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

function normalizeBerthId(rawId) {
  const value = String(rawId || "").trim().toUpperCase();
  const match = value.match(/^([A-Z]+)\s*0*([0-9]+)$/);
  if (!match) return value;
  const prefix = match[1];
  const number = Number(match[2]);
  if (!Number.isFinite(number)) return value;
  return `${prefix}${String(number).padStart(2, "0")}`;
}

function compareBerthIds(a, b) {
  const matchA = String(a).match(/^([A-Z]+)(\d+)$/);
  const matchB = String(b).match(/^([A-Z]+)(\d+)$/);
  if (!matchA || !matchB) {
    return String(a).localeCompare(String(b));
  }

  const prefixCompare = matchA[1].localeCompare(matchB[1]);
  if (prefixCompare !== 0) {
    return prefixCompare;
  }

  return Number(matchA[2]) - Number(matchB[2]);
}

function parseMarkerCsv(csvText) {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((h) => h.toLowerCase());
  const idIndex = headers.indexOf("id");
  const xIndex = headers.indexOf("x");
  const yIndex = headers.indexOf("y");

  if (idIndex < 0 || xIndex < 0 || yIndex < 0) {
    throw new Error("Coordinate CSV must include id,x,y headers.");
  }

  return rows
    .slice(1)
    .map((cells) => ({
      id: normalizeBerthId(cells[idIndex]),
      x: Number(cells[xIndex]),
      y: Number(cells[yIndex]),
    }))
    .filter((point) => point.id && Number.isFinite(point.x) && Number.isFinite(point.y));
}

function normalizeType(typeValue) {
  return String(typeValue || "S").trim().toUpperCase() === "P" ? "P" : "S";
}

function getBoatDirection(id) {
  const match = id.match(/(\d+)$/);
  const berthNumber = match ? Number(match[1]) : NaN;
  return Number.isFinite(berthNumber) && berthNumber % 2 === 0 ? "right" : "left";
}

function parsePositive(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function buildDefaultBerthData(points) {
  const data = {};
  points.forEach((point) => {
    data[point.id] = {
      owner: "",
      make: "",
      length: "30",
      beam: "10",
      name: "",
      type: "S",
    };
  });
  return data;
}

function loadSavedBerthData(defaultData) {
  try {
    const raw = localStorage.getItem(BERTH_STORAGE_KEY);
    if (!raw) {
      return defaultData;
    }
    const parsed = JSON.parse(raw);
    const merged = { ...defaultData };
    Object.keys(defaultData).forEach((id) => {
      if (parsed[id] && typeof parsed[id] === "object") {
        merged[id] = {
          ...defaultData[id],
          ...parsed[id],
          type: normalizeType(parsed[id].type),
        };
      }
    });
    return merged;
  } catch (_error) {
    return defaultData;
  }
}

function saveBerthData() {
  localStorage.setItem(BERTH_STORAGE_KEY, JSON.stringify(berthDataById));
}

function renderBerthTable() {
  const fragment = document.createDocumentFragment();
  const tablePoints = [...activePoints].sort((a, b) => compareBerthIds(a.id, b.id));

  tablePoints.forEach((point) => {
    const berthData = berthDataById[point.id];
    const row = document.createElement("tr");

    const berthCell = document.createElement("td");
    berthCell.className = "berth";
    berthCell.textContent = point.id;
    row.appendChild(berthCell);

    const editableFields = [
      { key: "owner", type: "text" },
      { key: "make", type: "text" },
      { key: "length", type: "number", min: "1", step: "0.1" },
      { key: "beam", type: "number", min: "1", step: "0.1" },
      { key: "name", type: "text" },
    ];

    editableFields.forEach((field) => {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = field.type;
      input.value = berthData[field.key] ?? "";
      input.dataset.id = point.id;
      input.dataset.field = field.key;
      if (field.min) input.min = field.min;
      if (field.step) input.step = field.step;
      cell.appendChild(input);
      row.appendChild(cell);
    });

    const typeCell = document.createElement("td");
    const typeSelect = document.createElement("select");
    typeSelect.dataset.id = point.id;
    typeSelect.dataset.field = "type";
    ["S", "P"].forEach((boatType) => {
      const option = document.createElement("option");
      option.value = boatType;
      option.textContent = boatType;
      option.selected = berthData.type === boatType;
      typeSelect.appendChild(option);
    });
    typeCell.appendChild(typeSelect);
    row.appendChild(typeCell);

    fragment.appendChild(row);
  });
  berthTableBody.replaceChildren(fragment);
}

function buildSailSvg() {
  const sailSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  sailSvg.setAttribute("viewBox", "0 0 100 40");
  sailSvg.setAttribute("preserveAspectRatio", "none");

  const outerHull = document.createElementNS("http://www.w3.org/2000/svg", "path");
  outerHull.setAttribute(
    "d",
    "M8 20 C8 10, 20 6, 50 5 C80 6, 92 10, 97 20 C92 30, 80 34, 50 35 C20 34, 8 30, 8 20 Z"
  );
  outerHull.setAttribute("fill", "none");
  outerHull.setAttribute("stroke", "#ffffff");
  outerHull.setAttribute("stroke-width", "2");
  outerHull.setAttribute("vector-effect", "non-scaling-stroke");

  const cockpit = document.createElementNS("http://www.w3.org/2000/svg", "path");
  cockpit.setAttribute(
    "d",
    "M28 20 C28 15, 38 12, 50 12 C62 12, 72 15, 72 20 C72 25, 62 28, 50 28 C38 28, 28 25, 28 20 Z"
  );
  cockpit.setAttribute("fill", "none");
  cockpit.setAttribute("stroke", "#ffffff");
  cockpit.setAttribute("stroke-width", "1.6");
  cockpit.setAttribute("vector-effect", "non-scaling-stroke");

  const keelLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  keelLine.setAttribute("x1", "34");
  keelLine.setAttribute("y1", "20");
  keelLine.setAttribute("x2", "66");
  keelLine.setAttribute("y2", "20");
  keelLine.setAttribute("stroke", "#ffffff");
  keelLine.setAttribute("stroke-width", "1.2");
  keelLine.setAttribute("vector-effect", "non-scaling-stroke");

  sailSvg.append(outerHull, cockpit, keelLine);
  return sailSvg;
}

function renderMarkers() {
  const fragment = document.createDocumentFragment();
  activePoints.forEach((point) => {
    const berthData = berthDataById[point.id] || {};
    const directionClass = getBoatDirection(point.id);
    const boatType = normalizeType(berthData.type);
    const rawLengthFeet = Number(berthData.length);
    const rawBeamFeet = Number(berthData.beam);
    const hasLength = Number.isFinite(rawLengthFeet) && rawLengthFeet > 0;
    const hasBeam = Number.isFinite(rawBeamFeet) && rawBeamFeet > 0;

    // Leave berth empty on the map until both dimensions are provided.
    if (!hasLength || !hasBeam) {
      return;
    }

    const lengthFeet = rawLengthFeet;
    const beamFeet = rawBeamFeet;
    const lengthPx = clamp(lengthFeet * FEET_TO_PIXEL, 12, 220);
    const beamPx = clamp(beamFeet * FEET_TO_PIXEL, 6, 70);

    const marker = document.createElement("div");
    marker.className = "marker";
    marker.classList.add(directionClass, boatType === "P" ? "power" : "sail");
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y}px`;
    marker.style.setProperty("--boat-length", `${lengthPx}px`);
    marker.style.setProperty("--boat-beam", `${beamPx}px`);
    marker.dataset.id = point.id;
    const tooltipText =
      `Berth: ${point.id}\n` +
      `Owner: ${berthData.owner || "-"}\n` +
      `Name: ${berthData.name || "-"}\n` +
      `Make: ${berthData.make || "-"}\n` +
      `Type: ${boatType}\n` +
      `Length: ${lengthFeet} ft\n` +
      `Beam: ${beamFeet} ft`;
    marker.dataset.tooltip = tooltipText;

    const boat = document.createElement("div");
    boat.className = "boat";
    const hull = document.createElement("span");
    hull.className = "hull";
    boat.appendChild(hull);

    if (boatType === "S") {
      boat.appendChild(buildSailSvg());
    } else {
      const cabin = document.createElement("span");
      cabin.className = "cabin";
      boat.appendChild(cabin);
    }

    marker.appendChild(boat);
    fragment.appendChild(marker);
  });
  markerLayer.replaceChildren(fragment);
}

function showTooltip(text, clientX, clientY) {
  if (!text) return;
  boatTooltip.textContent = text;
  boatTooltip.style.display = "block";
  moveTooltip(clientX, clientY);
}

function moveTooltip(clientX, clientY) {
  if (boatTooltip.style.display !== "block") return;
  const offset = 12;
  const rect = boatTooltip.getBoundingClientRect();
  let left = clientX + offset;
  let top = clientY + offset;
  if (left + rect.width > window.innerWidth - 8) {
    left = clientX - rect.width - offset;
  }
  if (top + rect.height > window.innerHeight - 8) {
    top = clientY - rect.height - offset;
  }
  boatTooltip.style.left = `${Math.max(8, left)}px`;
  boatTooltip.style.top = `${Math.max(8, top)}px`;
}

function hideTooltip() {
  boatTooltip.style.display = "none";
}

function renderAdminAndMap() {
  renderBerthTable();
  renderMarkers();
}

function applyInfoCsvToData(csvText) {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    throw new Error("Info CSV is empty.");
  }
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const getIndex = (aliases) => aliases.map((a) => headers.indexOf(a)).find((i) => i >= 0) ?? -1;

  const berthIndex = getIndex(["berth", "id"]);
  if (berthIndex < 0) {
    throw new Error("Info CSV must include a Berth or ID column.");
  }

  const fieldMap = [
    { key: "owner", index: getIndex(["owner"]) },
    { key: "make", index: getIndex(["make"]) },
    { key: "length", index: getIndex(["length", "lenth"]) },
    { key: "beam", index: getIndex(["beam"]) },
    { key: "name", index: getIndex(["name", "boat name"]) },
    { key: "type", index: getIndex(["type"]) },
  ];

  let updatedCount = 0;
  rows.slice(1).forEach((cells) => {
    const berth = normalizeBerthId(cells[berthIndex]);
    if (!berthDataById[berth]) return;
    fieldMap.forEach(({ key, index }) => {
      if (index < 0) return;
      const value = (cells[index] || "").trim();
      berthDataById[berth][key] = key === "type" ? normalizeType(value) : value;
    });
    updatedCount += 1;
  });

  saveBerthData();
  renderAdminAndMap();
  return updatedCount;
}

async function loadMarkersFromCsv(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load marker CSV: ${path}`);
  const csvText = await response.text();
  return parseMarkerCsv(csvText);
}

function zoomAt(clientX, clientY, deltaY) {
  const rect = viewport.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  const previousScale = state.scale;
  const minScale = getMinScale();
  const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
  const nextScale = clamp(previousScale * zoomFactor, minScale, state.maxScale);
  if (nextScale === previousScale) return;

  const stageXBefore = (mouseX - rect.width / 2 - state.x) / previousScale;
  const stageYBefore = (mouseY - rect.height / 2 - state.y) / previousScale;

  state.scale = nextScale;
  state.x = mouseX - rect.width / 2 - stageXBefore * nextScale;
  state.y = mouseY - rect.height / 2 - stageYBefore * nextScale;
  render();
}

viewport.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, event.deltaY);
  },
  { passive: false }
);

viewport.addEventListener("pointerdown", (event) => {
  state.dragging = true;
  state.dragStartX = event.clientX - state.x;
  state.dragStartY = event.clientY - state.y;
  viewport.classList.add("dragging");
  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  state.x = event.clientX - state.dragStartX;
  state.y = event.clientY - state.dragStartY;
  render();
});

function stopDragging(event) {
  if (!state.dragging) return;
  state.dragging = false;
  viewport.classList.remove("dragging");
  if (event && viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }
}

viewport.addEventListener("pointerup", stopDragging);
viewport.addEventListener("pointercancel", stopDragging);
viewport.addEventListener("pointerleave", stopDragging);

image.addEventListener("load", () => {
  const rect = viewport.getBoundingClientRect();
  const minScale = getMinScale();
  const fitScale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
  state.scale = clamp(fitScale, minScale, state.maxScale);
  state.x = -(image.naturalWidth * state.scale) / 2;
  state.y = -(image.naturalHeight * state.scale) / 2;
  render();
});

window.addEventListener("resize", () => {
  if (!image.naturalHeight) return;
  const minScale = getMinScale();
  if (state.scale < minScale) {
    state.scale = minScale;
    render();
  }
});

berthTableBody.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  const berthId = target.dataset.id;
  const field = target.dataset.field;
  if (!berthId || !field || !berthDataById[berthId]) return;

  berthDataById[berthId][field] = field === "type" ? normalizeType(target.value) : target.value;
  if (field === "type") target.value = berthDataById[berthId][field];
  saveBerthData();
  renderMarkers();
});

markerLayer.addEventListener("pointerover", (event) => {
  const marker = event.target.closest(".marker");
  if (!marker) return;
  showTooltip(marker.dataset.tooltip, event.clientX, event.clientY);
});

markerLayer.addEventListener("pointermove", (event) => {
  moveTooltip(event.clientX, event.clientY);
});

markerLayer.addEventListener("pointerout", (event) => {
  const marker = event.target.closest(".marker");
  if (!marker) return;
  const related = event.relatedTarget instanceof Element ? event.relatedTarget.closest(".marker") : null;
  if (related === marker) return;
  hideTooltip();
});

infoCsvInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const csvText = await file.text();
    const updatedCount = applyInfoCsvToData(csvText);
    importStatus.textContent = `Imported ${updatedCount} berth rows from ${file.name}.`;
  } catch (error) {
    importStatus.textContent = `Import failed: ${error.message}`;
  } finally {
    infoCsvInput.value = "";
  }
});

if (image.complete) {
  image.dispatchEvent(new Event("load"));
}

loadMarkersFromCsv("Berth Coordinates.csv")
  .catch(() => parseMarkerCsv(embeddedMarkerCsv))
  .then((points) => {
    activePoints = points;
    berthDataById = loadSavedBerthData(buildDefaultBerthData(points));
    applyInfoCsvToData(embeddedBerthInfoCsv);
    importStatus.textContent = "Table prefilled from embedded berth plan data.";
    renderAdminAndMap();
  })
  .catch((error) => {
    importStatus.textContent = `Failed to load coordinates: ${error.message}`;
  });
