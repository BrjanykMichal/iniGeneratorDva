* {
  font-size: 100%;
  margin: 0.15rem;
  padding: 0.1rem;
  box-sizing: border-box;
}
html {
  height: 100%;
}
body {
  margin: 1rem;
  width: 95%;
  height: 95%;
  background-color: #fefffe;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgb(173, 230, 173);
}

.znackaNody,
.inputNody {
  margin: 0;
  padding: 0.1rem;
  width: 2.5rem;
}
select {
  font-size: 1rem;
}
.znackaNody,
label,
input {
  outline: none;
  font-size: 1.2rem;
  transition: background-color 0.6s;
}
.bunkaNody,
.znackaNody {
  font-weight: bold;
  border: 1px solid black;
  background: rgb(241, 249, 241);
}
.inputNody {
  border: unset;
  transition: background-color 0.6s;
}
label {
  user-select: none;
}
table select {
  width: 100%;
}
div {
  background: white;
  border: 1px;
  border-style: solid;
  border-color: black;
  width: fit-content;
}
#nahledKontejner {
  overflow: auto;
  box-sizing: border-box;
}

#nodyKontejner {
  overflow: auto;
  max-height: 10rem;
  max-width: auto;
}

p {
  font-size: 1.1rem;
}
h2 {
  font-size: 1.5rem;
}
textarea {
  font-size: 1rem;
  resize: vertical;
}

/* Styly pro označeni nebo najezd na vybrany element. */
input:hover,
select:hover,
textarea:hover,
input:focus,
select:focus,
textarea:focus {
  border-color: rgb(153, 153, 255);
  outline: none;
  box-shadow: 0px 0px 6px 1px lightskyblue;
}
