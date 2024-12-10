// Vytvořeni tabulky s zobrazenim nodu:
const prirazeniNodu = document.getElementById("prirazeniNodu");
let znackaId = 1;
let bunkaId = 1;
for (let row = 1; row <= 26; row++) {
  const radek = document.createElement("tr");
  for (let col = 1; col <= 20 && bunkaId < 240; col++) {
    const bunka = document.createElement("td");
    if (row % 2 !== 0) {
      bunka.setAttribute("class", "znackaNodyDekoder");
      bunka.textContent = znackaId;
      znackaId++;
    } else {
      bunka.setAttribute("class", "inputNodyDekoder");
      bunka.id = `bunka-${bunkaId}`;
      bunka.textContent = 0;
      bunkaId++;
    }
    radek.appendChild(bunka);
  }
  prirazeniNodu.appendChild(radek);
}

// Importovani html elementu:
const vstupniHodnoty = document.getElementById("vstupniHodnoty");
const vystupniHodnoty = document.getElementById("vystupniHodnoty");
const tlacitkoDekodovat = document.getElementById("tlacitkoDekodovat");
const elementyTabulky = document.querySelectorAll("td");
// Parovani zkratky času a vyznamem:
const Casy = {
  "B+": "Astro +",
  "B-": "Astro -",
  "E+": "Astro +",
  "E-": "Astro -",
  F: "Přesně v:",
};
// Parovani modu rele:
const Rele = {
  1: "Vypnuto",
  2: "Spinani",
  3: "Trvale sepnuto",
};
// Reakce na stisknuti tlačitka "Dekodovat".
tlacitkoDekodovat.addEventListener("click", () => {
  let vstupniHodnotyPole = vstupniHodnoty.value.split("\n");
  // Zadame prazdnym buňkam hodnotu "neaktivni"
  for (let x = 0; x <= 53; x++) {
    elementyTabulky[x].textContent = "X";
  }

  kontrolaElementu(vstupniHodnotyPole);
});

//Hlavni funkce:
function kontrolaElementu(pole) {
  let casy;
  let skupina;
  let polePgf = [];
  let polePg = [];
  pole.forEach((element) => {
    //Kontrola verze SW:
    switch (true) {
      case element.includes("cislo ZM"):
        cisloZm.textContent = pole[pole.indexOf(element) + 1].split("=")[1];
        break;
      case element.includes("negace vstupu"):
        typSw.textContent = "Starý";
        break;
      case element.includes("nastaveni input a output"):
        typSw.textContent = "Nový";
        break;
      case element.includes("ACB=D20"):
        casovePasmo.textContent = "1";
        break;
      case element.includes("ACB=D80"):
        casovePasmo.textContent = "2";
        break;
      case element.includes("ACB=DC0"):
        casovePasmo.textContent = "3";
      case element.includes("EMBUSNR=0") || element.includes("EMBUSNR=DTS"):
        typElektromeru.textContent = "DTS";
        pocetElektromeru.textContent = element.split(";DTS").length + element.split(";WAGO").length - 2;
        break;
      case element.includes("EMBUSNR=WAGO"):
        typElektromeru.textContent = "WAGO";
        pocetElektromeru.textContent = element.split(";DTS").length + element.split(";WAGO").length - 2;
        break;
      case element.includes("LPFLAGS="):
        let lpflags = dekodovaniLpflags(element.split("=")[1]);
        pocetNodu.textContent = lpflags.split("0").length - 17;
        break;
      case element.includes("SB="):
        skupina = parseInt(element.charAt(1)) + 1;
        casy = casSpinani = dekodovaniCasu(element.slice(5));
        bunka = document.getElementById("funkceA-" + skupina);
        casy[1] ? (bunka.textContent = "Zapnuti") : (bunka.textContent = "Vypnuti");
        bunka = document.getElementById("casA-" + skupina);
        bunka.textContent = Casy[casy[0]] + " " + casy[2] + " h. " + casy[3] + " m.";
        break;
      case element.includes("SE="):
        skupina = parseInt(element.charAt(1)) + 1;
        casy = casSpinani = dekodovaniCasu(element.slice(5));
        bunka = document.getElementById("funkceB-" + skupina);
        casy[1] ? (bunka.textContent = "Zapnuti") : (bunka.textContent = "Vypnuti");
        bunka = document.getElementById("casB-" + skupina);
        bunka.textContent = Casy[casy[0]] + " " + casy[2] + " h. " + casy[3] + " m.";
        break;
      case /R\dM/.test(element):
        skupina = parseInt(element.charAt(1)) + 1;
        bunka = document.getElementById("releRezim-" + skupina);
        bunka.textContent = Rele[element.charAt(4)];
        break;
      case element.includes("PGF0"):
        polePgf = polePgf.concat(dekodovaniPg(element.split("=")[1]));
        bunka = document.getElementsByClassName("releSkupina");
        polePgf.forEach((element) => {
          // Zvyšime hodnotu každeho elementu +1:
          bunka[polePgf.indexOf(element)].textContent = element + 1;
        });
        break;
      case /PG\d/.test(element):
        polePg = polePg.concat(dekodovaniPg(element.split("=")[1]));
        break;
      default:
        break;
    }
  });
  bunka = document.getElementsByClassName("inputNodyDekoder");
  //Zadame prazdnym buňkam hodnotu "0" aby dodržet plny počet bodu 239.
  polePg = polePg.concat(Array(239 - polePg.length).fill(0));
  //Zvyšime +1 hodnotu každeho elementu:
  // polePg.forEach((hodnotaElementu, indexElementu, danePole) => {
  //   hodnotaElementu > 0 ? (danePole[indexElementu] = hodnotaElementu + 1) : null;
  // });
  //Odstranime nulovy nod.
  polePg.shift();
  for (let x = 0; x < polePg.length; x++) {
    //Zvyšime +1 hodnotu každeho elementu:
    bunka[x].textContent = polePg[x] > 0 ? polePg[x] + 1 : 0;
  }
}

// Funkci pro dekodovani vydal ChatGPT.Vysledek obsahoval chybu v podminkach if kde se rozlišuje mezi B+ a B-
// a taky mezi E+ a E-. Podminka upravena,vysledek minut musi byt menši 480.
function dekodovaniCasu(zakodovaneCislo) {
  const vykonModulo = 16;
  const power10 = Math.pow(2, 10); // 1024
  const power11 = Math.pow(2, 11); // 2048
  const power12 = Math.pow(2, 12); // 4096
  const vykon = Math.floor((zakodovaneCislo % (16 * power12)) / power12);
  let zbytek = zakodovaneCislo - (vykon % vykonModulo) * power12;
  let typCasu, vypocetMinuty;
  if (zbytek >= power11 + power10) {
    if (zbytek - power11 - power10 <= 480) {
      typCasu = "E+";
      vypocetMinuty = zbytek - power11 - power10;
    } else {
      typCasu = "E-";
      vypocetMinuty = -(zbytek - power11 - power10 - power10);
    }
  } else if (zbytek >= power11) {
    if (zbytek - power11 <= 480) {
      typCasu = "B+";
      vypocetMinuty = zbytek - power11;
    } else {
      typCasu = "B-";
      vypocetMinuty = -(zbytek - power11 - power10);
    }
  } else {
    typCasu = "F";
    vypocetMinuty = zbytek;
  }
  const hodina = Math.floor(vypocetMinuty / 60);
  const minuta = vypocetMinuty % 60;
  return [typCasu, vykon, hodina, minuta];
}

function kodovaniCasu(typCasu, vykon, hodina, minuta) {
  let vypocetVykon = (vykon % 16) * Math.pow(2, 12);
  let vypocetMinuty = hodina * 60 + minuta;
  let vypocetNegaceMinuty = vypocetMinuty > 0 ? Math.pow(2, 10) - vypocetMinuty : 0;
  let vypocetBPlus = Math.pow(2, 11) + vypocetMinuty;
  let vypocetBMinus = Math.pow(2, 11) + vypocetNegaceMinuty;
  let vypocetEPlus = vypocetBPlus + Math.pow(2, 10);
  let vypocetEMinus = vypocetBMinus + Math.pow(2, 10);
  let zakodovanyCas;
  switch (typCasu) {
    case "B+":
      zakodovanyCas = vypocetBPlus;
      break;
    case "B-":
      zakodovanyCas = vypocetBMinus;
      break;
    case "E+":
      zakodovanyCas = vypocetEPlus;
      break;
    case "E-":
      zakodovanyCas = vypocetEMinus;
      break;
    case "F":
      zakodovanyCas = vypocetMinuty;
      break;
  }
  return zakodovanyCas + vypocetVykon;
}
// Testovaci funkce pro kodovani PG:
function kodovaniPg(a, b, c, d, e, f, g, h) {
  let vypocet =
    a * Math.pow(2, 0 * 4) +
    b * Math.pow(2, 1 * 4) +
    c * Math.pow(2, 2 * 4) +
    d * Math.pow(2, 3 * 4) +
    e * Math.pow(2, 4 * 4) +
    f * Math.pow(2, 5 * 4) +
    g * Math.pow(2, 6 * 4) +
    h * Math.pow(2, 7 * 4);
  return vypocet;
}
// Funkce pro dekodovani PG:
// Přiklad argumentu: "1412567152"
// Vrati pole s 8 elementy kde každa hodnota udava čislo skupiny ve ktere prvek je.
function dekodovaniPg(vstup) {
  const vystup = [];
  for (let i = 0; i < 8; i++) {
    const vysledek = vstup % 16;
    // Tady je přiklad vypočtu jednoho bloku(8 bit) PG. Napřiklad: PG00=1412567152
    // Celočiselne děleni,napr: 40/16=2.5 -> 2...*16=32 -> 40-32=8  Vysledek je "8".
    // = 1412567152 % 16 =>1412567152 - 1412567152 = 0
    // = 88285447 % 16 => 88285447 - 882854440 = 7
    // = 5517840 % 16 => 5517840 - 5517840 = 0
    // = 344865 % 16 => 344865 - 344864 = 1
    // = 21554 % 16 => 21554 - 12552 = 2
    // = 1347 % 16 => 1347 - 1344 = 3
    // = 84 % 16 => 84 - 80 = 4
    // = 5 % 16 => 5 - 0 = 5
    // vysledek = [0,7,0,1,2,3,4,5]
    vystup.push(vysledek);
    vstup = Math.floor(vstup / 16);
  }
  return vystup;
}

// Testovaci funkce pro kodovani LPFLAGS.Jako argument přijme vstupniPole = 256 elementu 0 nebo 1.
// napřiklad: vstupniPole = [0,1,0,1,1,1,1,0,0,..];
function kodovaniLpflags(vstupniPole) {
  let prvniVypocetLpflags = [];
  let druhyVypocetLpflags = [];
  let nodyBajtyPole = [];
  let vysledekLpflags = "";
  for (let i = 0; i < 256; i += 8) {
    nodyBajtyPole = nodyBajtyPole.concat(Array(8).fill(i));
  }
  for (let i = 0; i < 256; i++) {
    let vypocetJedna = vstupniPole[i] * Math.pow(2, i - nodyBajtyPole[i]);
    prvniVypocetLpflags.push(vypocetJedna);
  }

  for (let i = 0; i < 256; i += 8) {
    druhyVypocetLpflags.push(prvniVypocetLpflags[i]);
    for (let y = 0; y < 7; y++) {
      druhyVypocetLpflags.push(prvniVypocetLpflags[i + y + 1] + druhyVypocetLpflags[i + y]);
    }
  }
  for (let i = 7; i < 256; i += 8) {
    let vypocetLpflags = druhyVypocetLpflags[i].toString(16).toUpperCase();
    if (vypocetLpflags.length < 2) {
      vysledekLpflags = vysledekLpflags + 0 + vypocetLpflags;
    } else {
      vysledekLpflags = vysledekLpflags + vypocetLpflags;
    }
  }
  return vysledekLpflags;
}

// Funkce pro dekodovani lpflags.
// Argument napřiklad: "05FDFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000"
function dekodovaniLpflags(vysledekLpflags) {
  const lpflagsArray = [];
  const lpflagsBinarniPole = [];
  let dekodovanyVysledek = [];
  for (let i = 0; i < vysledekLpflags.length; i += 2) {
    lpflagsArray.push(parseInt(vysledekLpflags.slice(i, i + 2), 16));
  }
  for (let i = 0; i < lpflagsArray.length; i++) {
    lpflagsBinarniPole.unshift(lpflagsArray[i].toString(2).padStart(8, "0"));
  }
  dekodovanyVysledek = lpflagsBinarniPole.join("");
  // Tady je matematicke zpracovani vypočtu jednoho bloku(8 bit) lpflags:
  // 85=(x7*Math.pow(2,7))+((x6*Math.pow(2,6))+((x5*Math.pow(2,6))+((x4*Math.pow(2,5))
  // +((x3*Math.pow(2,4))+((x2*Math.pow(2,3))+((x1*Math.pow(2,2))+((x0*Math.pow(2,1))+(0))))))));

  return dekodovanyVysledek;
}
// Kod pro spuštěni hudby:
let audioSoubor = document.getElementById("audioSoubor");
let audioTlacitko = document.getElementById("prepinacHudby");
audioTlacitko.addEventListener("change", () => {
  audioTlacitko.checked ? audioSoubor.play() : audioSoubor.pause();
});
let stylyVyber = document.getElementById("stylyVyber");
let stylyOdkaz = document.getElementById("stylyOdkaz");
stylyVyber.addEventListener("change", () => {
  if (stylyOdkaz.href.includes("Bitovka")) {
    stylyOdkaz.href = stylyOdkaz.href.replace("Bitovka", "Normalni");
    audioSoubor.pause();
    audioTlacitko.checked = 0;
    audioTlacitko.disabled;
    zvukyRozhraniVypnout();
  } else {
    stylyOdkaz.href = stylyOdkaz.href.replace("Normalni", "Bitovka");
    audioTlacitko.checked = 1;
    audioSoubor.play();
    zvukyRozhraniZapnout();
  }
});
// Kod pro zvuk inputu,selectu a tlačitek.
let zvukInputFocus = document.getElementById("zvukInputFocus");
let zvukInputChange = document.getElementById("zvukInputChange");
let zvukSelectClick = document.getElementById("zvukSelectClick");
let zvukCheckboxClick = document.getElementById("zvukCheckboxClick");
let zvukButtonClick = document.getElementById("zvukButtonClick");
let kolekceInputu = document.querySelectorAll("input[type=number],input[type=text]");
let kolekceSelectu = document.querySelectorAll("select");
let kolekceCheckboxu = document.querySelectorAll("input[type=checkbox],input[type=radio]");
let kolekceButtonu = document.querySelectorAll("input[type=button],input[type=submit]");

let zvukInputFocusPrehrat = function () {
  zvukInputFocus.currentTime = 0;
  zvukInputFocus.play();
};
let zvukInputChangePrehrat = function () {
  zvukInputChange.currentTime = 0;
  zvukInputChange.play();
};

let zvukSelectClickPrehrat = function () {
  zvukSelectClick.currentTime = 0;
  zvukSelectClick.play();
};
let zvukCheckboxClickPrehrat = function () {
  zvukCheckboxClick.currentTime = 0;
  zvukCheckboxClick.play();
};
let zvukButtonuClickPrehrat = function () {
  zvukButtonClick.currentTime = 0;
  zvukButtonClick.play();
};
let zvukyRozhraniZapnout = function () {
  kolekceInputu.forEach((input) => {
    input.addEventListener("focus", zvukInputFocusPrehrat);
    input.addEventListener("input", zvukInputChangePrehrat);
  });
  kolekceSelectu.forEach((select) => {
    select.addEventListener("click", zvukSelectClickPrehrat);
  });
  kolekceCheckboxu.forEach((checkbox) => {
    checkbox.addEventListener("change", zvukCheckboxClickPrehrat);
  });
  kolekceButtonu.forEach((button) => {
    button.addEventListener("click", zvukButtonuClickPrehrat);
  });
};
let zvukyRozhraniVypnout = function () {
  kolekceInputu.forEach((input) => {
    input.removeEventListener("focus", zvukInputFocusPrehrat);
    input.removeEventListener("input", zvukInputChangePrehrat);
  });
  kolekceSelectu.forEach((select) => {
    select.removeEventListener("click", zvukSelectClickPrehrat);
  });
  kolekceCheckboxu.forEach((checkbox) => {
    checkbox.removeEventListener("change", zvukCheckboxClickPrehrat);
  });
  kolekceButtonu.forEach((button) => {
    button.removeEventListener("click", zvukButtonuClickPrehrat);
  });
};
