if not exists (select 1
               from [dbo].[Magic_SystemMessages]
               where code = 'USRBLCK')
begin
    insert into [dbo].[Magic_SystemMessages]
           ([Code]
          , [Subject]
          , [Body]
          , [IsHtml]
          , [CultureId]
          , ModifiedDate)
    values ('USRBLK'
          , 'Avviso utente bloccato - {Username} - {ApplicationName}'
          , '<head>      <meta charset="utf-8">      <title></title>  </head>  <body>      <p>Gentile utente,</p>      <p>ricevi questa emai in automatico perché hai tentato più volte ad accedere con una password sbagliata e l''utenza è stata bloccata.</p>  Per sbloccare l''utenza, richiediamo gentilmente a seguire i passaggi inviati dalla mail di recupero password.<p></p>            <p>Grazie</p>      <p>---------------------------------------------------------------------------</p>      ATTENZIONE:<br>      Se non hai effettuato tentativi di accesso all''applicazione, ti chiediamo di contattare urgentemente il Servizio Clienti:<br>      E-Mail: helpdesk_ideare@idearespa.eu<br>      <p>---------------------------------------------------------------------------</p>    </body>'
          , 1
          , 76
          , getdate());
end;

