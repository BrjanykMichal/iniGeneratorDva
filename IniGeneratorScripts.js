src = "/IniGeneratorStyles.css";
// Bloky kodu ktere se budou vkladat do vysledku ini souboru.
// Společne šasti kodu:
const casoserver = `SNTP=set_zone=3600#set_interval=10000#datagram://192.168.220.200:123;timeout=2000`;
const dataConectionDaemon = `SC1=bearer_type=gprs;access_point=gprsa.techhmph;username=anonymous;password=xxx;timeout=300
DCOND=192.168.220.200:3582;test;echoid`;
// Časti jen pro stary SW:
const starySw = `#otoceni vstupu: otacime jistice:
BINNEG=49216`;
// Časti jen pro novy SW:
const novySw = `#nastavení input a output:
ioini1=BIN:id=cbrks;hw=bin1;neg;BIN:id=cbrk_arvo;hw=bin2;neg;BIN:id=fms1;hw=bin3;msg1="ZM AUTO";BIN:id=fms2;hw=bin4;
msg1="ZM RUCNE";BIN:id=ms;hw=bin5;msg1="HLAVNI VYPINACE ZAPNUTY";msg0="HLAVNI VYPINACE VYPNUTY";BIN:id=predk;hw=bin6;
msg1="PRE DVERE ZAVRENY";msg0="PRE DVERE OTEVRENY";BIN:id=dk;hw=bin7;neg;BIN:id=sp;hw=bin8;
ioini2=BOUT:id=rel1;hw=bout1;BOUT:id=rel2;hw=bout2;BOUT:id=rel3;hw=bout3;BOUT:id=rel4;hw=bout4;BOUT:id=rel5;hw=bout5;
BOUT:id=rel6;hw=bout6;BOUT:id=rel7;hw=bout7;BOUT:id=rel8;hw=bout8;`;
//Mode- časy spinani a automatika skupin:
const Casy = {
  astroCasy: [43008, 3072],
  prechodCasy: [44002, 3102],
  spozdeniCasy: [43009, 3072],
  trvalaCasy: [40960, 40960],
  evrCasy: [43009, 4095],
  nodyCasy: [40960, 40960],
};

// Časove pasma:
const casovePasma = {
  prvniPasmo: `ACB=D20305050D132949314F1E2F0F130A08090407000BFA0AF60FE90FE51CC313D712DA0CEA08F508F309F708FB07000502\nACE=DF0107FE0CF510EA10E21AC91CC510E208F209F209F50AF907FD08000A0509070809131C141E2E4629440B100A0D0807040207010000`,
  druhePasmo: `ACB=D80305050D132949314F1E2F0F130A08090407000BFA0AF60FE90FE51CC313D712DA0CEA08F508F309F708FB07000502\nACE=D90107FE0CF510EA10E21AC91CC510E208F209F209F50AF907FD08000A0509070809131C141E2E4629440B100A0D0807040207010000`,
  tretiPasmo: `ACB=DC0305050D132949314F1E2F0F130A08090407000BFA0AF60FE90FE51CC313D712DA0CEA08F508F309F708FB07000502\nACE=D50107FE0CF510EA10E21AC91CC510E208F209F209F50AF907FD08000A0509070809131C141E2E4629440B100A0D0807040207010000`,
};
//Regulačni křivky:
const Regulace = {
  aJedna: `0080F0A0`,
  aDva: `0070F0A0`,
  bJedna: `64852CA1`,
  bDva: `64752CA1`,
  cJedna: `288568A1`,
  cDva: `287568A1`,
  cTri: `286568A1`,
  k: `28752CA1`,
};

// Skripta:
// Importovani formulařu,checkboxu a selectu:
let skupiny = document.getElementsByName("skupina");
let dataForm = document.getElementById("dataForm");
let tlacitkoStahnout = document.getElementById("stahnout");
let tlacitkoPriraditNody = document.getElementById("priraditNody");
//Blokovani tlačitka VYTVOŘIT když nejsou zvolene všechny elementy formulaře s atributem required.
//Po zmačknuti na VYTVOŘIT se odblokuje tlačitko STAHNOUT.
dataForm.addEventListener("submit", function (event) {
  event.preventDefault();
  assignValues();
  tlacitkoStahnout.disabled = 0;
});
//Po zmačknuti tlačitka STAHNOUT se obnovi nahled ini souboru,pak se stahne,pak se tlačitlo zablokuje.
tlacitkoStahnout.addEventListener("click", function () {
  downloadIniFile();
  tlacitkoStahnout.disabled = 1;
});
tlacitkoPriraditNody.addEventListener("click", priraditNody);
// Kod tlačitka Vytvořit.Da dohromdy všechny zadany inputy a vysledek vypiše v textarea na strance.
function assignValues() {
  // parseInt převede text s čislem ZM na number a taky odstrani nulu na začatku když tam je.
  const cisloZm = "ID=" + parseInt(document.getElementById("cisloZm").value, 10);
  // funkce pro CheckBox Novy SW:
  let novySwCheckbox = function () {
    if (document.getElementById("novySwCheckbox").checked) {
      return novySw;
    } else {
      return starySw;
    }
  };
  let novySwCheckboxVysledek = novySwCheckbox();

  // Funkce pro vyběe Pasma:
  let vyberPasma = function () {
    let pasma = document.getElementsByName("pasmo");
    for (pasmo of pasma) {
      if (pasmo.checked) {
        return pasmo.value;
      }
    }
  };
  let pasmoVysledek = casovePasma[vyberPasma()];
  // Volame funkci pro sběr dat z tabulky nodu:
  sberDatZTabulkyNodu();
  let regulaceVysledek = regulaceVypocet();
  let elektromeryVysledek = elektromeryVypocet();
  let autosidsVysledek = autosidsVypocet();
  // Vysledek pro vyběr Skupin a nastaveni času spinani Mode:
  let skupinyAModeVysledek = "";
  let funkceProRele = "";
  let cisloskupiny = 0;
  for (skupina of skupiny) {
    if (skupina.checked) {
      let modeDaneSkupiny = document.getElementById(skupina.id + "Mode");
      let vybranyCas = `${modeDaneSkupiny.value + "Casy"}`;
      skupinyAModeVysledek += `
#časy spinani a automatika ${skupina.value}:
G${cisloskupiny}SB= ${Casy[vybranyCas][0]}
G${cisloskupiny}SE=${Casy[vybranyCas][1]}
G${cisloskupiny}AE=1
`;
      // Tady bude přidani pro skupiny EVR nebo NODY zapnuti Regulačni křivky.
      // Pro režim Mode relatka se zada #NODY,tzn rele nema žadny ražim spinani.
      if (modeDaneSkupiny.value == "evr") {
        skupinyAModeVysledek += `G${cisloskupiny}RE=1`;
        funkceProRele += `
#funkce pro Relé ${cisloskupiny + 1}:
#NODY`;
        // Tady když skupina ovlada nody a nejsou to EVR,tak přidame Skupina x je slave Skupiny 0.
      } else if (modeDaneSkupiny.value == "nody") {
        skupinyAModeVysledek += `G${cisloskupiny}RE=1\nG${cisloskupiny}SL=0\n`;
        funkceProRele += `
#funkce pro Relé ${cisloskupiny + 1}:
#NODY`;
      }
      // Tady se nastavi režim Mode pro relatka kde nejsou nody na 2 -> Spinani.
      else {
        funkceProRele += `
#funkce pro Relé ${cisloskupiny + 1}:
R${cisloskupiny}M=2`;
      }
    }
    cisloskupiny++;
  }
  // Vysledne data pro nahled po zmačknuti tlačitka Vytvořit:
  let formData = `#čislo ZM:
${cisloZm}\n
#casoserver:
${casoserver}\n
#datconnection daemon:
${dataConectionDaemon}\n
${novySwCheckboxVysledek}\n
#Časove pasmo:
${pasmoVysledek}
${skupinyAModeVysledek}
${funkceProRele}\n
#Zobrazovane skupiny:
RMSGM=${rmsgmVysledek}
${regulaceVysledek}\n
#setup EMBUS elektroměr:
${elektromeryVysledek}\n
#PG a PGF:
${vysledekPg}
#PT a PTF:
${vysledekPt}
#Automaticky odesilana data:
${autosidsVysledek}`;

  // Když nod č.1 chybi tak je považovano že nody nejsou vubec,tim lpflags,pg a pt v ini souboru nebude.
  if (!nodyPritomnost[1]) {
    formData += `
#Lpflags:
${vysledekLpflags}\n
`;
  }
  // Отображаем данные в текстовом поле
  document.getElementById("outputArea").value = formData;
  return formData;
}
//Funkce pro AUTOSIDS1 a AUTOSIDS1 + AUTOSIDS4 u noveho SW :
function autosidsVypocet() {
  let autosidsVysledek = "";
  let autosidsJedna = "AUTOSIDS1=5;0;afm;";
  let autosidsCtyry = "AUTOSIDS4=60;0;";
  let novySwCheckbox = document.getElementById("novySwCheckbox");
  let cisloskupiny = 0;
  for (skupina of skupiny) {
    let skupinaMode = document.getElementById(skupina.id + "Mode");
    if (skupina.checked) {
      autosidsJedna += "gps" + cisloskupiny + ";";
      //Když se nejedna o Nody nebo EVR tzn. skupina ovlada stykač a ma elektroměr.
      if (skupinaMode.value !== "evr" && skupinaMode.value !== "nody") {
        autosidsCtyry +=
          "eme" +
          (cisloskupiny + 1) +
          ";i" +
          (cisloskupiny + 11) +
          ";i" +
          (cisloskupiny + 21) +
          ";i" +
          (cisloskupiny + 31) +
          ";";
      }
    }
    cisloskupiny++;
  }
  // Odstranime posledni symbol ";"
  autosidsCtyry = autosidsCtyry.slice(0, -1);
  if (novySwCheckbox.checked) {
    autosidsVysledek = autosidsJedna + "dk;up;sp;eum;eua;arvosc;outsc" + "\n" + autosidsCtyry;
  } else {
    autosidsVysledek = autosidsJedna + "dk;cons;econs;up;sp;sc;eum;eua";
  }
  return autosidsVysledek;
}
// Funkce pro vypočet elektroměru EMBUSNR:
function elektromeryVypocet() {
  let elektromeryVysledek = "";
  let novySwCheckbox = document.getElementById("novySwCheckbox");
  if (novySwCheckbox.checked) {
    elektromeryVysledek += "EMBUSNR=WAGO879:1;";
    let cisloskupiny = 11;
    for (skupina of skupiny) {
      let skupinaMode = document.getElementById(skupina.id + "Mode");
      if (skupina.checked && skupinaMode.value !== "evr" && skupinaMode.value !== "nody") {
        elektromeryVysledek += "WAGO879:" + cisloskupiny + ";";
      }
      cisloskupiny++;
    }
  } else {
    elektromeryVysledek = `EMBUSNR=0`;
  }
  return elektromeryVysledek;
}
// Zpracovani vyběru regulačnich křivek:
function regulaceVypocet() {
  let regulaceVysledek = "";
  let cisloskupiny = 0;
  for (skupina of skupiny) {
    let skupinaRegulace = document.getElementById(skupina.id + "Regulace");
    let skupinaMode = document.getElementById(skupina.id + "Mode");
    skupina.checked && (skupinaMode.value == "evr" || skupinaMode.value == "nody")
      ? (regulaceVysledek += `
#Regulace ${skupina.value}:
G${cisloskupiny}RC= ${Regulace[skupinaRegulace.value]}`)
      : null;
    cisloskupiny++;
  }
  return regulaceVysledek;
}

// funkce pro vypočet a zobrazeni RMSGM. Vyvolava se ve funkci blokovaniVyberu
let rmsgmVysledek = 0;
function vypocetRmsgm() {
  let rmsgmKalkulace =
    2 ** 0 * skupiny[0].checked +
    2 ** 1 * skupiny[1].checked +
    2 ** 2 * skupiny[2].checked +
    2 ** 3 * skupiny[3].checked +
    2 ** 4 * skupiny[4].checked +
    2 ** 5 * skupiny[5].checked +
    2 ** 6 * skupiny[6].checked +
    2 ** 7 * skupiny[7].checked;
  let rmsgm = document.getElementById("rmsgm");
  rmsgm.innerHTML = "RMSGM=" + rmsgmKalkulace;
  rmsgmVysledek = rmsgmKalkulace;
}
//Kod pro blokovani vyběru Mode když neni vybrana Skupina:
for (skupina of skupiny) {
  // skupina je prvni element z skupiny-node list checkboxu.
  // skupinaVPoradi je konkretni checkbox.
  // skupinaMode je vyběr z Astro,Přechod atd.
  //skupinaRegulace je konkretni vyběr z regulaci.
  let skupinaVPoradi = document.getElementById(skupina.id);
  let skupinaRegulace = document.getElementById(skupinaVPoradi.id + "Regulace");
  let skupinaMode = document.getElementById(skupinaVPoradi.id + "Mode");
  // funkce pro blokovani vyběru:
  function blokovaniVyberu() {
    skupinaMode.disabled = !skupinaVPoradi.checked;
    skupinaRegulace.disabled = !(
      skupinaVPoradi.checked &&
      (skupinaMode.value === "nody" || skupinaMode.value === "evr")
    );
    vypocetRmsgm();
  }
  skupina.addEventListener("change", blokovaniVyberu);
  skupinaMode.addEventListener("change", blokovaniVyberu);
}

//Tabulka s vyběrem a zobrazenim nodu a jejich skupin:
//Kod pro vytvořeni tabulky:
const nodyTabulka = document.getElementById("nodyTabulka");
let znackaId = 1;
let bunkaId = 1;
for (let row = 1; row <= 24; row++) {
  const radek = document.createElement("tr");
  for (let col = 1; col <= 20; col++) {
    const bunka = document.createElement("td");
    bunka.setAttribute("class", "bunkaNody");
    if (row % 2 !== 0) {
      bunka.setAttribute("class", "znackaNody");
      bunka.textContent = znackaId;
      znackaId++;
    } else {
      const input = document.createElement("input");
      input.setAttribute("class", "inputNody");
      input.setAttribute("value", 0);
      input.type = "number";
      input.min = 0;
      input.max = 8;
      input.id = `bunka-${bunkaId}`;
      bunka.appendChild(input);
      bunkaId++;
    }
    radek.appendChild(bunka);
  }
  nodyTabulka.appendChild(radek);
}
//Odstranime input pro pozici 240 protože tam začina rele misto nodu.
document.getElementById("bunka-240").remove();

//Kod Pro tlačitko Přiřazeni nodu. Změni hodnotu value u vybranych nodu na zakladě vybraneho rozsahu:
function priraditNody() {
  const minRozsah = parseInt(document.getElementById("minNodu").value);
  const maxRozsah = parseInt(document.getElementById("maxNodu").value);
  const skupinaNodu = parseInt(document.getElementById("skupinaNodu").value);
  if (minRozsah > maxRozsah || minRozsah < 0 || maxRozsah > 240) {
    alert("Špatně zadany rozsah nodu!");
    return;
  } else if (skupinaNodu > 8) {
    alert("Maximalni čislo skupiny je 8!");
  }
  for (let i = minRozsah; i <= maxRozsah; i++) {
    const vybranyNod = document.getElementById(`bunka-${i}`);
    vybranyNod.value = skupinaNodu;
    zmenaBarvy(vybranyNod);
  }
}
function test() {
  console.log("hi");
}
// Tady budou uchovane hodnoty z tabulky adres nodu pro dalši vypočet LPFLAGS,PG a PT:
let nodyValuePole = [];
let nodyPritomnost = [];
let nodyBajtyPole = [];
let prvniVypocetLpflags = [];
let druhyVypocetLpflags = [];
let vysledekLpflags = "LPFLAGS=";
let vysledekPg = "";
let vysledekPt = "";
// Funkce pro sběr dat z tabulky s nody.Tady se vypočita Lpflags, PG a PT.
function sberDatZTabulkyNodu() {
  vysledekLpflags = "LPFLAGS=";
  vysledekPg = "";
  vysledekPt = "";
  // Vytvoři pole kde bude 256 symbolu, 32x od 1 do 8. Je to potřebny aby spojit 8 nodu do jednoho bajtu.
  //Nasledně to použijem pro vypočet Lpflags.
  nodyBajtyPole = [];
  for (let i = 0; i < 256; i += 8) {
    nodyBajtyPole = nodyBajtyPole.concat(Array(8).fill(i));
  }

  let inputNody = document.querySelectorAll(".inputNody");
  // Vytvoři pole kde bude čislo skupiny ke ktere nod patři:
  let nodyValuePole = [];
  nodyValuePole = Array.from(inputNody).map((hodnota) => Number(hodnota.value));
  nodyValuePole = nodyValuePole.map((hodnota) => Math.max(hodnota - 1, 0));

  nodyValuePole.push(0, 1, 2, 3, 4, 5, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0);
  nodyValuePole.unshift(0);
  // Vytvořeni pole kde bude zaznam o přitomnosti nodu (1-Neni,0-Je):
  nodyPritomnost = [];
  for (value of nodyValuePole) {
    value > 0 ? nodyPritomnost.push(0) : nodyPritomnost.push(1);
  }
  for (let i = 240; i < 256; i++) {
    nodyPritomnost[i] = 0;
  }
  //Tady je prvni,druhy a vysledny vypočet pro Lpflags.
  //Vypočet je rozdělen do tři poli,je to obdoba sloupcu Excel kde puvodně byl provaděn vypočet.
  let prvniVypocetLpflags = [];
  let druhyVypocetLpflags = [];
  for (let i = 0; i < 256; i++) {
    let vypocetJedna = nodyPritomnost[i] * Math.pow(2, i - nodyBajtyPole[i]);
    prvniVypocetLpflags.push(vypocetJedna);
  }
  for (let i = 0; i < 256; i += 8) {
    druhyVypocetLpflags.push(prvniVypocetLpflags[i]);
    for (let y = 0; y < 7; y++) {
      druhyVypocetLpflags.push(prvniVypocetLpflags[i + y + 1] + druhyVypocetLpflags[i + y]);
    }
  }
  // Vysledny vypočet hodnot pro Lpflags.Vezme 8,16,32... element "druhyVypocetLpflags",převede na Hex,
  //pak spoji dohromady. Když delka Hex<2 tak přida 0 na začatek.

  for (let i = 7; i < 256; i += 8) {
    let vypocetLpflags = druhyVypocetLpflags[i].toString(16).toUpperCase();
    if (vypocetLpflags.length < 2) {
      vysledekLpflags = vysledekLpflags + 0 + vypocetLpflags;
    } else {
      vysledekLpflags = vysledekLpflags + vypocetLpflags;
    }
  }

  // Vypočet pro PG a PT:
  let hodnotaPg = [];
  let hodnotaPt = [];
  let docasnaHodnotaPg = 0;
  let docasnaHodnotaPt = 0;
  for (let i = 0; i < 256; i++) {
    let y = i % 8;
    docasnaHodnotaPg += nodyValuePole[i] * Math.pow(2, y * 4);
    // Tady je podminka že hodnoty PT plati jen pro Nody(typ zařizeni-6) do adresy 240.
    //Potom už jsou Relay(typ zařizeni-14).Proto vysledek vypočtu vždy bude: 4008636142
    i < 240
      ? (docasnaHodnotaPt += !nodyPritomnost[i] * 6 * Math.pow(2, y * 4))
      : (docasnaHodnotaPt = 4008636142);
    if (y == 7 && docasnaHodnotaPg > 0 && docasnaHodnotaPt > 0) {
      hodnotaPg.push([i - 7, docasnaHodnotaPg]);
      hodnotaPt.push([i - 7, docasnaHodnotaPt]);
      docasnaHodnotaPg = 0;
      docasnaHodnotaPt = 0;
    }
  }

  for (hodnota of hodnotaPg) {
    let nazevPg = hodnota[0].toString(16).toUpperCase();
    if (nazevPg.length < 2) {
      nazevPg = 0 + nazevPg;
    }
    vysledekPg += "PG" + nazevPg + "=" + hodnota[1] + "\n";
  }
  // Tady přidame 15 aby vychazel vypočet pt kde adresa "0" ma hodnotu 15=neznamy bod.
  hodnotaPt[0][1] += 15;
  for (hodnota of hodnotaPt) {
    let nazevPt = hodnota[0].toString(16).toUpperCase();
    if (nazevPt.length < 2) {
      nazevPt = 0 + nazevPt;
    }
    vysledekPt += "PT" + nazevPt + "=" + hodnota[1] + "\n";
  }

  // console.log("nody Value: " + nodyValuePole + " delka: " + nodyValuePole.length);
  // console.log("nody Bajty: " + nodyBajtyPole + "delka: " + nodyBajtyPole.length);
  // console.log("prvni Vypocet lpflags: " + prvniVypocetLpflags + "delka: " + prvniVypocetLpflags.length);
  // console.log("druhy Vypocet lpflags: " + druhyVypocetLpflags + " delka: " + druhyVypocetLpflags.length);
  // console.log("Nody Přitomnost: " + nodyPritomnost + " delka: " + nodyPritomnost.length);
  // console.log("Vysledek vysledekLpflags: " + vysledekLpflags + " delka: " + vysledekLpflags.length);
  // console.log("Hodnota PG: " + hodnotaPg + " delka: " + hodnotaPg.length);
  // console.log("Vysledek PG: " + "\n" + vysledekPg + " delka: " + vysledekPg.length);
  // console.log("Hodnota PT: " + hodnotaPt + " delka: " + hodnotaPt.length);
  // console.log("Vysledek PT " + "\n" + vysledekPt + " delka: " + vysledekPt.length);
}

//Kod pro tlačitko Stahnout:
function downloadIniFile() {
  // Получаем значения из формы
  const name = document.getElementById("cisloZm").value;
  const popisZm = document.getElementById("popisZm").value;

  // Формируем данные в формате .ini
  const iniData = assignValues();

  // Создаем Blob с содержимым .ini файла
  const blob = new Blob([iniData], { type: "text/plain" });
  // Создаем ссылку для скачивания файла
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name + "-" + popisZm + ".ini";

  // Инициируем скачивание
  link.click();
}
// Tady bude script na zbarveni inputu tabulky Nodu při změně hodnoty value:
let bunkaNodySeznam = document.getElementsByClassName("inputNody");
for (bunka of bunkaNodySeznam) {
  bunka.addEventListener("input", function (bunka) {
    bunka.target.style.backgroundColor = "lightblue";
    setTimeout(function () {
      bunka.target.style.backgroundColor = "";
    }, 600);
  });
}
function zmenaBarvy(input) {
  input.style.backgroundColor = "lightblue";
  setTimeout(function () {
    input.style.backgroundColor = "";
  }, 600);
}
