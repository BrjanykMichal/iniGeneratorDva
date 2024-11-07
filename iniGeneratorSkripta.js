// Bloky kodu ktere se budou vkladat do vysledku ini souboru.
// Společny blok:
const casoserver = `SNTP=set_zone=3600#set_interval=10000#datagram://192.168.220.200:123;timeout=2000`;
const dataConectionDaemon = `SC1=bearer_type=gprs;access_point=gprsa.techhmph;username=anonymous;password=xxx;timeout=300
DCOND=192.168.220.200:3582;test;echoid`;
// Blok jen pro stary SW:
const starySw = `#negace vstupu BINxA a BINxB
BINNEG=49216`;
// Blok jen pro novy SW:
const novySw = `#nastaveni input a output
ioini1=BIN:id=cbrks;hw=bin1;neg;BIN:id=cbrk_arvo;hw=bin2;neg;BIN:id=fms1;hw=bin3;msg1="ZM AUTO";BIN:id=fms2;hw=bin4;msg1="ZM RUCNE";BIN:id=ms;hw=bin5;msg1="HLAVNI VYPINACE ZAPNUTY";msg0="HLAVNI VYPINACE VYPNUTY";BIN:id=predk;hw=bin6;msg1="PRE DVERE ZAVRENY";msg0="PRE DVERE OTEVRENY";BIN:id=dk;hw=bin7;neg;BIN:id=sp;hw=bin8;
ioini2=BOUT:id=rel1;hw=bout1;BOUT:id=rel2;hw=bout2;BOUT:id=rel3;hw=bout3;BOUT:id=rel4;hw=bout4;BOUT:id=rel5;hw=bout5;BOUT:id=rel6;hw=bout6;BOUT:id=rel7;hw=bout7;BOUT:id=rel8;hw=bout8;`;
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

//.................. Hlavni funkce............
function assignValues() {
  let cisloZmVysledek = cisloZmFunkce();
  let novySwCheckboxVysledek = novySwCheckbox();
  let pasmoVysledek = casovePasma[vyberPasma()];
  let vysledkyLpPgPt = sberDatZTabulkyNodu();
  let vysledekLpflags = vysledkyLpPgPt[0].trimEnd();
  let vysledekPg = vysledkyLpPgPt[1].trimEnd();
  let vysledekPt = vysledkyLpPgPt[2].trimEnd();
  let regulaceVysledek = regulaceVypocet().trimEnd();
  let elektromeryVysledek = elektromeryVypocet();
  let autosidsVysledek = autosidsVypocet();
  let vysledkySkupinRele = skupinyCasyReleRezimy();
  let skupinyAutomatRegulaceCasy = vysledkySkupinRele[0].trimEnd();
  let relatkaRezimy = vysledkySkupinRele[1].trimEnd();
  let rmsgmVysledek = vypocetRmsgm();
  // Vysledne data pro nahled po zmačknuti tlačitka Vytvořit:
  let formData = `#cislo ZM
${cisloZmVysledek}
#casoserver
${casoserver}
#datconnection daemon
${dataConectionDaemon}
${novySwCheckboxVysledek}
#casove pasmo
${pasmoVysledek}
${skupinyAutomatRegulaceCasy}
${relatkaRezimy}
#zobrazovane skupiny
${rmsgmVysledek}
${regulaceVysledek}
#setup EMBUS elektromer
${elektromeryVysledek}
#PG a PGF
${vysledekPg}
#PT a PTF
${vysledekPt}
#automaticky odesilana data
${autosidsVysledek}
${vysledekLpflags}`;
  // Zobrazi vysledek v textovem poli.
  document.getElementById("textovePoleNahled").value = formData;
  // Vraci vysledek aby funkce šla použit u tlačitka Stahnout.
  return formData;
}
// ...............Tady konči funkce AsigneValues..........

//Funkce pro čislo ZM.ParseInt převede text s čislem ZM na number a taky odstrani nulu na začatku když tam je.
function cisloZmFunkce() {
  let cisloZm = "ID=" + parseInt(document.getElementById("cisloZm").value, 10);
  return cisloZm;
}
// Funkce pro CheckBox Novy SW:
let novySwCheckbox = function () {
  if (document.getElementById("novySwCheckbox").checked) {
    return novySw;
  } else {
    return starySw;
  }
};
// Funkce pro vyběr Pasma:
let vyberPasma = function () {
  let pasma = document.getElementsByName("pasmo");
  for (pasmo of pasma) {
    if (pasmo.checked) {
      return pasmo.value;
    }
  }
};

// Funkce pro nastaveni času zap a vyp u skupin a taky režimu vystupnich rele.
function skupinyCasyReleRezimy() {
  let skupinyAutomatRegulaceCasy = "";
  let relatkaRezimy = "";
  let cisloskupiny = 0;
  for (skupina of skupiny) {
    if (skupina.checked) {
      let modeDaneSkupiny = document.getElementById(skupina.id + "Mode");
      let vybranyCas = `${modeDaneSkupiny.value + "Casy"}`;
      skupinyAutomatRegulaceCasy += `#casy spinani a automatika ${skupina.value}
G${cisloskupiny}SB=${Casy[vybranyCas][0]}
G${cisloskupiny}SE=${Casy[vybranyCas][1]}
G${cisloskupiny}AE=1\n`;
      // Tady bude přidani pro skupiny EVR nebo NODY zapnuti Regulačni křivky.
      // Pro skupinu s EVR a NODY se zada řežim relatka #NODY,tzn rele nema žadný režim spinani.
      if (modeDaneSkupiny.value == "evr") {
        skupinyAutomatRegulaceCasy += `G${cisloskupiny}RE=1\n`;
        relatkaRezimy += `#funkce pro Rele ${cisloskupiny + 1}\n#NODY\n`;
        // Tady když skupina ovlada NODY a nejsou to EVR,tak přidame Skupina x je slave Skupiny 0.
      } else if (modeDaneSkupiny.value == "nody") {
        skupinyAutomatRegulaceCasy += `G${cisloskupiny}RE=1\nG${cisloskupiny}SL=0\n`;
        relatkaRezimy += `#funkce pro Rele ${cisloskupiny + 1}\n#NODY\n`;
      }
      // Tady se nastavi pro skupiny bez Nodu,režim relatek: 2 -> Spinani.
      else {
        relatkaRezimy += `#funkce pro Rele ${cisloskupiny + 1}\nR${cisloskupiny}M=2\n`;
      }
    }
    cisloskupiny++;
  }
  // Odstrani bile znaky a \n na konci řetězce:
  return [skupinyAutomatRegulaceCasy, relatkaRezimy];
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
      ? (regulaceVysledek += `#regulace ${skupina.value}\nG${cisloskupiny}RC=${
          Regulace[skupinaRegulace.value]
        }\n`)
      : null;
    cisloskupiny++;
  }
  return regulaceVysledek;
}

// funkce pro vypočet a zobrazeni RMSGM. Vyvolava se automaticky ve funkci blokovaniVyberu
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
  let rmsgmElement = document.getElementById("rmsgm");
  rmsgmElement.innerHTML = "RMSGM=" + rmsgmKalkulace;
  return "RMSGM=" + rmsgmKalkulace;
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

// Funkce pro sběr dat z tabulky s nody.Tady se vypočita Lpflags, PG a PT.
function sberDatZTabulkyNodu() {
  let vysledekLpflags = "";
  let vysledekPg = "";
  let vysledekPt = "";
  // Vytvoři pole kde bude 256 symbolu, 32x od 1 do 8. Je to potřebny aby spojit 8 nodu do jednoho bajtu.
  //Nasledně to použijem pro vypočet Lpflags.
  let nodyBajtyPole = [];
  for (let i = 0; i < 256; i += 8) {
    nodyBajtyPole = nodyBajtyPole.concat(Array(8).fill(i));
  }

  let inputNody = document.querySelectorAll(".inputNody");
  // Vytvoři pole kde budou čisla skupiny ke ktere nod patři,celkem 256 pozic s čišly od 0 do 8:
  let nodyValuePole = [];
  nodyValuePole = Array.from(inputNody).map((hodnota) => Number(hodnota.value));
  let nodyValuePoleProVypocet = nodyValuePole.map((hodnota) => Math.max(hodnota - 1, 0));
  nodyValuePole.push(0, 1, 2, 3, 4, 5, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0);
  nodyValuePole.unshift(0);
  nodyValuePoleProVypocet.push(0, 1, 2, 3, 4, 5, 6, 7, 0, 0, 0, 0, 0, 0, 0, 0);
  nodyValuePoleProVypocet.unshift(0);
  // Vytvořeni pole kde bude zaznam o přitomnosti nodu (1-Neni,0-Je):
  let nodyPritomnost = [];
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
  // Tady se kontroluje zda vysledek LPFLAGS neni stejny
  let nulovaHondotaLpflags = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000";
  vysledekLpflags == nulovaHondotaLpflags
    ? (vysledekLpflags = "")
    : (vysledekLpflags = "#seznam pritomnych nodu\nLPFLAGS=" + vysledekLpflags);
  // Vypočet pro PG a PT:
  // Tady bude pole hodnot pro PT:
  function zadaniNodyPtData() {
    let soucet = 0;
    nodyPritomnost.forEach((prvek) => {
      soucet += prvek;
    });
    if (soucet < 240) {
      return 15;
    } else {
      return 0;
    }
  }
  let nodyPtData = [zadaniNodyPtData()];
  for (let i = 1; i < 256; i++) {
    if (!nodyPritomnost[i] && i < 240) {
      nodyPtData.push(6);
    } else if (nodyPritomnost[i] && i < 240) {
      nodyPtData.push(0);
    } else {
      nodyPtData.push(14);
    }
  }

  let hodnotaPg = [];
  let hodnotaPt = [];
  let docasnaHodnotaPg = 0;
  let docasnaHodnotaPt = 0;
  for (let i = 0; i < 256; i++) {
    let y = i % 8;

    docasnaHodnotaPg += nodyValuePoleProVypocet[i] * Math.pow(2, y * 4);
    // Tady je podminka že hodnoty PT plati jen pro Nody(typ zařizeni-6) do adresy 240.
    //Potom už jsou Relay(typ zařizeni-14).Proto vysledek vypočtu vždy bude: 4008636142
    docasnaHodnotaPt += nodyPtData[i] * Math.pow(2, y * 4);
    if (y == 7 && docasnaHodnotaPg > 0) {
      hodnotaPg.push([i - 7, docasnaHodnotaPg]);
      docasnaHodnotaPg = 0;
    }
    // Když checme zobrazit PTF všech 16 rele,tak musime vymazat i<=248
    // Když chceme zobrazit PT včetně nuloveho nodu,tak musime smazat 15<
    if (y == 7 && docasnaHodnotaPt > 0 && i <= 248) {
      hodnotaPt.push([i - 7, docasnaHodnotaPt]);
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

  for (hodnota of hodnotaPt) {
    let nazevPt = hodnota[0].toString(16).toUpperCase();
    if (nazevPt.length < 2) {
      nazevPt = 0 + nazevPt;
    }
    vysledekPt += "PT" + nazevPt + "=" + hodnota[1] + "\n";
  }

  // console.log("nodyValuePole: " + nodyValuePole + " delka: " + nodyValuePole.length);
  // console.log(
  //   "nodyValuePoleProVypocet: " + nodyValuePoleProVypocet + " delka: " + nodyValuePoleProVypocet.length
  // );
  // console.log("nody Bajty: " + nodyBajtyPole + "delka: " + nodyBajtyPole.length);
  // console.log("prvni Vypocet lpflags: " + prvniVypocetLpflags + "delka: " + prvniVypocetLpflags.length);
  // console.log("druhy Vypocet lpflags: " + druhyVypocetLpflags + " delka: " + druhyVypocetLpflags.length);
  // console.log("Nody Přitomnost: " + nodyPritomnost + " delka: " + nodyPritomnost.length);
  // console.log("Vysledek vysledekLpflags: " + vysledekLpflags + " delka: " + vysledekLpflags.length);
  // console.log("Hodnota PG: " + hodnotaPg + " delka: " + hodnotaPg.length);
  // console.log("Vysledek PG: " + "\n" + vysledekPg + " delka: " + vysledekPg.length);
  // console.log("Hodnota PT: " + hodnotaPt + " delka: " + hodnotaPt.length);
  // console.log("Vysledek PT " + "\n" + vysledekPt + " delka: " + vysledekPt.length);
  // console.log("nodyPtData: " + nodyPtData + " delka: " + nodyPtData.length);

  return [vysledekLpflags, vysledekPg, vysledekPt];
}

//Skripta pro tlačitko Stahnout:
function downloadIniFile() {
  const name = document.getElementById("cisloZm").value;
  const popisZm = document.getElementById("popisZm").value;
  const iniData = assignValues();
  const blob = new Blob([iniData], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "SW " + name + "_" + popisZm + ".ini";
  link.click();
}

// Změna barvy pozadi Inputu,reaguje na manualni změnu hodnoty value Inputu.
let bunkaNodySeznam = document.getElementsByClassName("inputNody");
for (bunka of bunkaNodySeznam) {
  bunka.addEventListener("input", function (bunka) {
    bunka.target.style.backgroundColor = "#ede584";
    setTimeout(function () {
      bunka.target.style.backgroundColor = "";
    }, 600);
  });
}
// Změna barvy pozadi Inputu,vyvolava se ve funkci tlačitka PriraditNody
function zmenaBarvy(input) {
  input.style.backgroundColor = "#ede584";
  setTimeout(function () {
    input.style.backgroundColor = "";
  }, 600);
}
// Kod pro spuštěni hudby:
let audioSoubor = document.getElementById("audioSoubor");
let audioTlacitko = document.getElementById("prepinacHudby");
audioTlacitko.addEventListener("change", () => {
  audioTlacitko.checked ? audioSoubor.play() : audioSoubor.pause();
});
// Scripta por přepinani stylu stranky:
let titulniNadpis = document.getElementById("titulniNadpis");
let stylyOdkaz = document.getElementById("stylyOdkaz");
// Lokalni počitač odkaz:
// let stylJedna = "http://localhost:3000/iniGeneratorStylyNormalni.css";
// let stylDva = "http://localhost:3000/iniGeneratorStylyBitovka.css";
// GitHub odkaz:
let gitHubCssOdkaz="https://brjanykmichal.github.io/iniGeneratorDva/iniGeneratorStylyNormalni.css";
let stylJedna = "iniGeneratorStylyNormalni.css";
let stylDva = "iniGeneratorStylyBitovka.css";
titulniNadpis.onclick = function () {
  if (stylyOdkaz.href !== gitHubCssOdkaz) {
    stylyOdkaz.href = stylJedna;
    audioSoubor.pause();
    audioTlacitko.checked = 0;
    audioTlacitko.disabled;
    zvukyRozhraniVypnout();
  } else {
    stylyOdkaz.href = stylDva;
    audioTlacitko.checked = 1;
    audioSoubor.play();
    zvukyRozhraniZapnout();
  }
};
// Kod pro zvuk inputu,selectu a tlačitek.
let zvukInputFocus = document.getElementById("zvukInputFocus");
let zvukInputChange = document.getElementById("zvukInputChange");
let zvukSelectChange = document.getElementById("zvukSelectChange");
let kolekceInputu = document.querySelectorAll("input");
let kolekceSelectu = document.querySelectorAll("select");

let zvukInputFocusPrehrat = function () {
  zvukInputFocus.currentTime = 0;
  zvukInputFocus.play();
};
let zvukInputChangePrehrat = function () {
  zvukInputChange.currentTime = 0;
  zvukInputChange.play();
};
let zvukSelectChangePrehrat = function () {
  zvukSelectChange.currentTime = 0;
  zvukSelectChange.play();
};
let zvukyRozhraniZapnout = function () {
  kolekceInputu.forEach((input) => {
    input.addEventListener("focus", zvukInputFocusPrehrat);
    input.addEventListener("input", zvukInputChangePrehrat);
  });
  kolekceSelectu.forEach((select) => {
    select.addEventListener("change", zvukSelectChangePrehrat);
  });
};
let zvukyRozhraniVypnout = function () {
  kolekceInputu.forEach((input) => {
    input.removeEventListener("focus", zvukInputFocusPrehrat);
    input.removeEventListener("input", zvukInputChangePrehrat);
  });
  kolekceSelectu.forEach((select) => {
    select.removeEventListener("change", zvukSelectChangePrehrat);
  });
};
