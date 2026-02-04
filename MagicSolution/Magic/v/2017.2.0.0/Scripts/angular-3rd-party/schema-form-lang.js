define(['angular-schema-form-core'], function (schemaForm) {
    var lang = {
        "de-DE": {
            default: "Feld nicht valide",
            0: "Ungültiger Typ (erwartet wurde: {{schema.type}})",
            1: "Keine Übereinstimmung mit der Aufzählung (enum) für: {{viewValue}]",
            10: "Daten stimmen nicht überein mit einem der Schemas von \"anyOf\"",
            11: "Daten stimmen nicht überein mit einem der Schemas von \"oneOf\"",
            12: "Daten sind valid in Bezug auf mehreren Schemas von \"oneOf\"",
            13: "Daten stimmen mit dem \"not\" Schema überein",
            // Numeric errors
            100: "Wert {{viewValue}} ist kein Vielfaches von {{schema.multipleOf}}",
            101: "Wert {{viewValue}} ist kleiner als das Minimum {{schema.minimum}}",
            102: "Wert {{viewValue}} ist gleich dem Exklusiven Minimum {{schema.minimum}}",
            103: "Wert {{viewValue}} ist größer als das Maximum {{schema.maximum}}",
            104: "Wert {{viewValue}} ist gleich dem Exklusiven Maximum {{schema.maximum}}",
            105: "Wert {{viewValue}} ist keine valide Nummer",
            // String errors
            200: "Zeichenkette zu kurz ({{viewValue.length}}} chars), minimum {{schema.minLength}}",
            201: "Zeichenkette zu lang ({{viewValue.length}} chars), maximum {{schema.maxLength}}",
            202: "Zeichenkette entspricht nicht dem Muster: {{schema.pattern}}",
            // Object errors
            300: "Zu wenige Attribute definiert, minimum {{schema.minProperties}}",
            301: "Zu viele Attribute definiert, maximum {{schema.maxProperties}}",
            302: "Pflichtfeld",
            303: "Zusätzliche Attribute nicht erlaubt",
            304: "Abhängigkeit fehlt - Schlüssel nicht vorhanden",
            // Array errors
            400: "Array zu kurz ({{value.length}}), minimum {{schema.minItems}}",
            401: "Array zu lang ({{value.length}}), maximum {{schema.maxItems}}",
            402: "Array Einträge nicht eindeutig",
            403: "Zusätzliche Einträge nicht erlaubt",
            // Format errors
            500: "Validierung des Formates fehlgeschlagen",
            501: "Schlüsselwort fehlgeschlagen: \"{{title}}\"",
            // Schema structure
            600: "Circular $refs",
            // Non-standard validation options
            1000: "Unbekannte Eigenschaft (nicht im schema)"
        },
        "it-IT": {
            default: "Campo non valido",
            0: "Tipo non valido (expected {{schema.type}})",
            1: "Nessun enum corrisponde a: {{viewValue}}",
            10: "I dati non corrispondono a nessun schema di \"anyOf\"",
            11: "I dati non corrispondono a nessun schema di \"oneOf\"",
            12: "Dati validi per più di uno schema di \"oneOf\"",
            13: "I dati corrispondono allo schema di \"not\"",
            // Numeric errors
            100: "Il valore {{viewValue}} non è un multiplo di {{schema.multipleOf}}",
            101: "Il valore {{viewValue}} è minore del minimo {{schema.minimum}}",
            102: "Il valore {{viewValue}} è uguale al minimo esclusivo {{schema.minimum}}",
            103: "Il valore {{viewValue}} è maggiore del massimo {{schema.maximum}}",
            104: "Il valore {{viewValue}} è uguale al massimo esclusivo {{schema.maximum}}",
            105: "Il valore {{viewValue}} non è un numero valido",
            // String errors
            200: "La stringa è troppo corta ({{viewValue.length}} chars), minimo {{schema.minLength}}",
            201: "La stringa è troppo lunga ({{viewValue.length}} chars), massimo {{schema.maxLength}}",
            202: "La stringa non corrisponde al modello: {{schema.pattern}}",
            // Object errors
            300: "Le proprietà definite sono troppo poche, minimo {{schema.minProperties}}",
            301: "Le proprietà definite sono troppe, massimo {{schema.maxProperties}}",
            302: "Campo obbligatorio",
            303: "Proprietà aggiuntive non ammesse",
            304: "Dipendenza errata - la chiave deve esistere",
            // Array errors
            400: "L'array é troppo corto ({{value.length}}), minimo {{schema.minItems}}",
            401: "L'array è troppo lungo ({{value.length}}), massimo {{schema.maxItems}}",
            402: "Gli elementi dell'array non sono univoci",
            403: "Non sono permessi ulteriori elementi",
            // Format errors
            500: "La validazione del formato è fallita",
            501: "Parola chiave errata: \"{{title}}\"",
            // Schema structure
            600: "Circular $refs",
            // Non-standard validation options
            1000: "Proprietà sconosciuta (non presente nello schema)"
        }
    };
    if (window.culture && window.culture in lang) {
        schemaForm.config(["sfErrorMessageProvider", function (sfErrorMessageProvider) {
            var defaultMessages = lang[window.culture];
            defaultMessages.number = defaultMessages[105];
            defaultMessages.required = defaultMessages[302];
            defaultMessages.min = defaultMessages[101];
            defaultMessages.max = defaultMessages[103];
            defaultMessages.maxlength = defaultMessages[201];
            defaultMessages.minlength = defaultMessages[200];
            defaultMessages.pattern = defaultMessages[202];
            sfErrorMessageProvider.setDefaultMessages(defaultMessages);
        }]);
    }

    return schemaForm;
});
