<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reftree download page</title>
    <script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.0/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.fileDownload/1.4.2/jquery.fileDownload.min.js" integrity="sha512-MZrUNR8jvUREbH8PRcouh1ssNRIVHYQ+HMx0HyrZTezmoGwkuWi1XoaRxWizWO8m0n/7FXY2SSAsr2qJXebUcA==" crossorigin="anonymous"></script>
    <link href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.0/css/bootstrap.min.css" rel="stylesheet" id="bootstrap-css">
</head>
<body>
    <!------ Include the above in your HEAD tag ---------->
    <div class="container">
        <div style="margin-top: 20%;" class="row">
            <div class="col-md-6">
                <div class="error-template">
                    <h1>Benvenuto alla pagina di download di RefTree
                    </h1>
                    <div>
                        <p>
                            I file da te selezionati saranno scaricati localmente sulla tua macchina.
                        </p>
                        <h5 id="fname"></h5>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <img style="margin-top: 30px;" src="/Magic/Images/1459254176280-reftreeBBB.png" />
            </div>
        </div>
    </div>
    <script type="text/javascript">
        const urlParams = new URLSearchParams(window.location.search);
        const filename = urlParams.get('fileName');
        $("#fname").text("Download in corso del file:" + filename);
        $.fileDownload('/api/Documentale/PublicGetFile' + window.location.search)
            .done(function (e) {
                console.log(e);
                $("#fname").text(filename + " :: Download terminato! ");
            });
                
    </script>
</body>
</html>




