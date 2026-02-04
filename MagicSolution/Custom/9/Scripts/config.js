var primeCustom = window.includesVersion + "/Custom/9/Scripts/";



requirejs.config({
    paths: {
        'async': primeCustom + 'async',
        'geocomplete': primeCustom + 'jquery.geocomplete.min',
        'geo': primeCustom + 'geo'
    }
});