
function refereonchange(e) {

    if (e.type == "text") {
        e.container = [e.closest(".k-edit-form-container")];
    }
    else {
        e.container = [$(e.sender.wrapper).closest(".k-edit-form-container")];
    }
    
    // e.container = [$(e.sender.wrapper).closest(".k-edit-form-container")];
    dropDownListOnChange(e);
    //onChangeFieldmanageStageConstraints(e);
} 


function CodDFisc(e) {

    var lang = kendo.culture()["name"].replace('-', '_');
    var cf = $("#" + e.id).val();
	//var address= $("#LOCATIONdd").val();
    //L.A: modificata per renderla più generica 
    var address=$("input[data-value-field='LOCATION_ID']").val()
    //aggiunta if
	if(address!=null && address.length > 1)
    {
	var langu =address.substring(address.lastIndexOf(",")+1,address.length).trim();
	
	if (langu)
		{ if(langu!="Italia")
			{lang="EE";}
	
		}
    }
	
	
    if (lang == "it_IT") {
		
			if  (isFinite(cf)==true )
			{
					var Msg =ControllaPIVA(cf,e.id);				
				
			}
			
			else if (isFinite(cf) == false && e.id == 'LE_REFERE_TAX_CODE')
			{	kendoConsole.log("La partita iva non  può contenere caratteri alfanumerici","info");
				Msg="";}
			else 
			{
				 var Msg = ControllaCF(cf);
		
			}
		
        if (cf.length > 1 && Msg.length > 1 )
        {
            
			kendoConsole.log(Msg,"info");
        }
       
    }

}


function ControllaCF(cf)
{
    var validi, i, s, set1, set2, setpari, setdisp ,Err;
    if( cf == '' )  return '';
    cf = cf.toUpperCase();
	Err="";
    if( cf.length != 16 )        
		Err+="Il codice fiscale dovrebbe essere lungo\n"
			+"esattamente 16 caratteri.\n";
    validi = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for( i = 0; i < 16; i++ ){
        if( validi.indexOf( cf.charAt(i) ) == -1 )
			Err+="Il codice fiscale contiene un carattere non valido `" +
                cf.charAt(i) +
                "'.\nI caratteri validi sono le lettere e le cifre.\n";
     
    }
    set1 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    set2 = "ABCDEFGHIJABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setpari = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setdisp = "BAKPLCQDREVOSFTGUHMINJWZYX";
    s = 0;
    for( i = 1; i <= 13; i += 2 )
        s += setpari.indexOf( set2.charAt( set1.indexOf( cf.charAt(i) )));
    for( i = 0; i <= 14; i += 2 )
        s += setdisp.indexOf( set2.charAt( set1.indexOf( cf.charAt(i) )));
    if( s%26 != cf.charCodeAt(15)-'A'.charCodeAt(0) )
         Err+="il codice di controllo non corrisponde.\n";
    return Err;
}

function ControllaPIVA(pi,field)
{	
    
	var MsgIva;
    if( pi == '' )  return '';
	MsgIva="";
    if( pi.length != 11 )
           MsgIva+= field=="LE_REFERE_TAX_CODE_2"?"Il codice fiscale dovrebbe essere lungo esattamente 11 caratteri.\n;":"La partita iVAdovrebbe essere lunga  esattamente 11 caratteri.\n;"  //+" dovrebbe essere lunga\n" +
          //  "esattamente 11 caratteri.\n";
    validi = "0123456789";
    for( i = 0; i < 11; i++ ){
        if( validi.indexOf( pi.charAt(i) ) == -1 )
            MsgIva+= "La partita IVA contiene un carattere non valido `" +
                pi.charAt(i) + "'.\nI caratteri validi sono le cifre.\n";
    }
    s = 0;
    for( i = 0; i <= 9; i += 2 )
        s += pi.charCodeAt(i) - '0'.charCodeAt(0);
    for( i = 1; i <= 9; i += 2 ){
        c = 2*( pi.charCodeAt(i) - '0'.charCodeAt(0) );
        if( c > 9 )  c = c - 9;
        s += c;
    }
    if( ( 10 - s%10 )%10 != pi.charCodeAt(10) - '0'.charCodeAt(0) )
          MsgIva+=  "il codice di controllo non corrisponde.\n";
    return MsgIva;
}

function isInt(value) {
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}