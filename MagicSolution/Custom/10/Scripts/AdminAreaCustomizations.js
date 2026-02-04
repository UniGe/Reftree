// funzione custom che ritorna le tipologie di aree organizzative per le applicazioni
function getSpecificAppAssignedCodeValues() {
    return [{value:"DEF",text:"DEFAULT"}];
}

function removeUnwantedGroupInfo()
{
   //$("#rolediv").remove();
    return;
}

//campi da non filtrare nella feature di filtro testuale da toolbar delle grid 
window.gridexcludefromfastsearch = ["JSON_FOR_CONTACT"];